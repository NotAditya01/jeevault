require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { upload } = require('./utils/uploadHandler');
const Resource = require('./models/Resource');
const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk');
const { validateConfig, config } = require('./utils/config');
const { uploadPdfToCloudinary, isCloudinaryConfigured } = require('./utils/cloudinary');

// Validate environment variables before starting
try {
    validateConfig();
} catch (error) {
    console.error(chalk.red('\n❌ Server startup failed: ') + error.message);
    process.exit(1);
}

// Check if Cloudinary is configured
const cloudinaryEnabled = isCloudinaryConfigured();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    if (body && typeof body === 'string' && body.includes('</head>')) {
      body = body.replace('</head>', '<script defer src="/_vercel/insights/script.js"></script></head>');
    }
    originalSend.call(this, body);
  };
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
console.log(chalk.blue('\n Connecting to MongoDB...\n'));
mongoose.connect(config.mongodbUri)
    .then(() => console.log(chalk.green('✅ Connected to MongoDB\n')))
    .catch(err => {
        console.error(chalk.red('❌ MongoDB connection error:'), err);
        process.exit(1);
    });

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const [username, password] = Buffer.from(token, 'base64').toString().split(':');

    if (username === config.admin.username && password === config.admin.password) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// Admin login route
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === config.admin.username && password === config.admin.password) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// URL validation helper
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// For backward compatibility - support .html extension too
app.get('/upload.html', (req, res) => {
  res.redirect('/upload');
});

app.get('/admin.html', (req, res) => {
  res.redirect('/admin');
});

// API Routes
app.post('/api/resources', upload.single('file'), async (req, res) => {
    console.log(chalk.blue('📝 Resource upload request received'));
    console.log(chalk.gray(`Body: ${JSON.stringify(req.body)}`));
    console.log(chalk.gray(`File: ${req.file ? JSON.stringify({
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
    }) : 'No file'}`));
    
    try {
        const { title, description, type, subject, tag, url, uploadedBy } = req.body;

        if (!title || !description || !subject || !tag) {
            console.log(chalk.yellow('⚠️ Missing required fields'));
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const resource = new Resource({
            title,
            description,
            subject,
            type: type || 'file',
            tag,
            uploadedBy: uploadedBy || 'Anonymous',
            approved: false // Always start as unapproved
        });

        if (type === 'file' || !type) {
            if (!req.file) {
                console.log(chalk.yellow('⚠️ No file uploaded'));
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Check if we're in production (Vercel)
            const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
            
            if (isProduction) {
                // In production, use Cloudinary if configured
                if (!cloudinaryEnabled) {
                    console.log(chalk.yellow('⚠️ Cloudinary not configured in production environment'));
                    return res.status(400).json({ 
                        error: 'File uploads are not supported in the production environment. Please use URL resources instead.',
                        production: true
                    });
                }
                
                try {
                    // Upload to Cloudinary
                    const cloudinaryResult = await uploadPdfToCloudinary(
                        req.file.buffer, 
                        req.file.originalname
                    );
                    
                    // Store Cloudinary URL in the database
                    resource.fileUrl = cloudinaryResult.secure_url;
                    console.log(chalk.green(`✅ File uploaded to Cloudinary: ${resource.fileUrl}`));
                } catch (cloudinaryError) {
                    console.error(chalk.red(`❌ Cloudinary upload error: ${cloudinaryError.message}`));
                    return res.status(500).json({ error: 'Failed to upload file to cloud storage' });
                }
            } else {
                // In development, use local file storage
                // Ensure uploads directory exists
                const uploadsDir = path.join(__dirname, 'uploads');
                if (!fs.existsSync(uploadsDir)) {
                    console.log(chalk.blue('📁 Creating uploads directory'));
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }

                // Store file path in the database
                resource.fileUrl = `/uploads/${req.file.filename}`;
                console.log(chalk.green(`✅ File saved locally: ${resource.fileUrl}`));
            }
        } else if (type === 'url') {
            if (!url) {
                console.log(chalk.yellow('⚠️ No URL provided'));
                return res.status(400).json({ error: 'No URL provided' });
            }
            
            if (!isValidUrl(url)) {
                console.log(chalk.yellow(`⚠️ Invalid URL: ${url}`));
                return res.status(400).json({ error: 'Invalid URL format' });
            }
            
            resource.url = url;
            console.log(chalk.green(`✅ URL added: ${url}`));
        }

        await resource.save();
        console.log(chalk.green(`✅ Resource saved to database: ${resource._id}`));
        res.status(201).json({ 
            success: true, 
            message: 'Resource submitted successfully! It will be available after admin approval.',
            resource
        });
    } catch (error) {
        console.error(chalk.red(`❌ Error creating resource: ${error.message}`));
        console.error(chalk.red(error.stack));
        res.status(500).json({ error: error.message || 'Failed to create resource' });
    }
});

// Get approved resources only
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ approved: true })
      .sort('-createdAt');
    
    const formattedResources = resources.map(resource => ({
      ...resource.toObject(),
      formattedDate: moment(resource.createdAt).format('D MMMM YYYY, h:mm A')
    }));
    
    res.json(formattedResources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Admin routes - protected with authentication
app.get('/admin/resources', authenticateAdmin, async (req, res) => {
  try {
    const resources = await Resource.find()
      .sort('-createdAt');
    
    const formattedResources = resources.map(resource => ({
      ...resource.toObject(),
      formattedDate: moment(resource.createdAt).format('D MMMM YYYY, h:mm A')
    }));
    
    res.json(formattedResources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.patch('/admin/resources/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve resource' });
  }
});

// New endpoint for editing resources
app.put('/admin/resources/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, subject, tag, uploadedBy } = req.body;
    
    if (!title || !description || !subject || !tag) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        description, 
        subject, 
        tag,
        uploadedBy: uploadedBy || 'Anonymous'
      },
      { new: true, runValidators: true }
    );
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    console.log(chalk.green(`✅ Resource updated: ${resource._id}`));
    res.json(resource);
  } catch (error) {
    console.error(chalk.red(`❌ Error updating resource: ${error.message}`));
    res.status(500).json({ error: error.message || 'Failed to update resource' });
  }
});

app.delete('/admin/resources/:id', authenticateAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // If it's a file type resource, delete the file
    if (resource.type === 'file' && resource.fileUrl) {
      const filePath = path.join(__dirname, resource.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(chalk.green(`✅ File deleted: ${filePath}`));
      }
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(chalk.red(`❌ Delete error: ${error.message}`));
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start server
app.listen(config.port, () => {
    console.log(chalk.green(`\n🚀 Server is running on port ${config.port}\n`));
}); 