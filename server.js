require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { upload, cloudinary } = require('./utils/cloudinary');
const Resource = require('./models/Resource');
const fs = require('fs');
const moment = require('moment');

// Debug environment variables
console.log('Admin username from env:', process.env.ADMIN_USERNAME);
console.log('Admin password from env:', process.env.ADMIN_PASSWORD ? '[SET]' : '[NOT SET]');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const [username, password] = Buffer.from(token, 'base64').toString().split(':');

  console.log('Auth attempt:', { username, hasPassword: !!password });
  console.log('Expected:', { 
    username: process.env.ADMIN_USERNAME, 
    hasPassword: !!process.env.ADMIN_PASSWORD 
  });

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Admin login route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, hasPassword: !!password });
  console.log('Expected:', { 
    username: process.env.ADMIN_USERNAME, 
    hasPassword: !!process.env.ADMIN_PASSWORD 
  });

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
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

// Function to upload file to Cloudinary
async function uploadToCloudinary(filePath) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'raw',
            folder: 'jee_vault_uploads'
        });
        return result;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to cloud storage');
    }
}

// API Routes
app.post('/api/resources', upload.single('file'), async (req, res) => {
    try {
        const { title, description, type, subject, tag } = req.body;

        if (!title || !description || !subject || !tag) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const resource = new Resource({
            title,
            description,
            subject,
            type: type || 'file',
            tag
        });

        if (type === 'file' || !type) {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Upload file to Cloudinary
            const result = await uploadToCloudinary(req.file.path);
            resource.fileUrl = result.secure_url;
            resource.cloudinaryPublicId = result.public_id;

            // Clean up the temporary file
            fs.unlinkSync(req.file.path);
        } else if (type === 'url') {
            if (!req.body.url) {
                return res.status(400).json({ error: 'No URL provided' });
            }
            resource.url = req.body.url;
        }

        await resource.save();
        res.status(201).json(resource);
    } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({ error: error.message || 'Failed to create resource' });
    }
});

// Get approved resources
app.get('/api/resources', async (req, res) => {
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

app.delete('/admin/resources/:id', authenticateAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // If it's a file type resource, delete from Cloudinary
    if (resource.type === 'file' && resource.fileURL) {
      // Extract public_id from Cloudinary URL
      const publicId = resource.fileURL.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 