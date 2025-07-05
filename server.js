require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Resource = require('./models/Resource');
const chalk = require('chalk');
const { validateConfig, config, getMongoDbOptions } = require('./utils/config');

// Validate environment variables before starting
try {
    validateConfig();
} catch (error) {
    console.error(chalk.red('\n❌ Server startup failed: ') + error.message);
    process.exit(1);
}

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

// Connect to MongoDB with improved connection options
console.log(chalk.blue('\n Connecting to MongoDB...\n'));

// Add connection parameters directly to the URI if not already present
let mongoUri = config.mongodbUri;
if (!mongoUri.includes('?')) {
    mongoUri += '?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=45000';
} else if (!mongoUri.includes('connectTimeoutMS')) {
    mongoUri += '&connectTimeoutMS=30000&socketTimeoutMS=45000';
}

mongoose.connect(mongoUri, getMongoDbOptions())
    .then(() => console.log(chalk.green('✅ Connected to MongoDB\n')))
    .catch(err => {
        console.error(chalk.red('❌ MongoDB connection error:'), err);
        process.exit(1);
    });

// Add connection event listeners for better error handling
mongoose.connection.on('error', (err) => {
    console.error(chalk.red(`MongoDB connection error: ${err}`));
});

mongoose.connection.on('disconnected', () => {
    console.log(chalk.yellow('MongoDB disconnected. Attempting to reconnect...'));
});

mongoose.connection.on('reconnected', () => {
    console.log(chalk.green('MongoDB reconnected'));
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
app.post('/api/resources', async (req, res) => {
    console.log(chalk.blue('📝 Resource submission request received'));
    console.log(chalk.gray(`Body: ${JSON.stringify(req.body)}`));
    
    try {
        const { title, description, subject, tag, url, uploadedBy } = req.body;

        // Validate required fields
        if (!title || !description || !subject || !tag || !url) {
            console.log(chalk.yellow('⚠️ Missing required fields'));
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate URL
        if (!isValidUrl(url)) {
            console.log(chalk.yellow(`⚠️ Invalid URL: ${url}`));
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Create new resource
        const resource = new Resource({
            title,
            description,
            subject,
            tag,
            url,
            uploadedBy: uploadedBy || 'Anonymous',
            approved: false // Always start as unapproved
        });

        await resource.save();
        console.log(chalk.green(`✅ Resource saved to database: ${resource._id}`));
        res.status(201).json({ 
            success: true, 
            message: 'Your resource has been submitted. It will appear after admin approval.',
            resource
        });
    } catch (error) {
        console.error(chalk.red(`❌ Error creating resource: ${error.message}`));
        console.error(chalk.red(error.stack));
        res.status(500).json({ error: error.message || 'Failed to create resource' });
    }
});

// Get all resources (approved only)
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await Resource.find({ approved: true })
            .sort({ createdAt: -1 });
        res.json(resources);
    } catch (error) {
        console.error(chalk.red(`❌ Error fetching resources: ${error.message}`));
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

// Admin routes
app.get('/api/admin/resources', authenticateAdmin, async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const resources = await Resource.find({ 
            approved: status === 'approved'  // This will be true for approved, false for pending
        }).sort({ createdAt: -1 });
        
        console.log(chalk.blue(`📋 Fetching ${status} resources`));
        console.log(chalk.gray(`Found ${resources.length} resources`));
        
        res.json(resources);
    } catch (error) {
        console.error(chalk.red(`❌ Error fetching admin resources: ${error.message}`));
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

app.put('/api/admin/resources/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        );
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json(resource);
    } catch (error) {
        console.error(chalk.red(`❌ Error approving resource: ${error.message}`));
        res.status(500).json({ error: 'Failed to approve resource' });
    }
});

app.delete('/api/admin/resources/:id', authenticateAdmin, async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        console.error(chalk.red(`❌ Error deleting resource: ${error.message}`));
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

// Admin: Update resource
app.put('/api/admin/resources/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, subject, tag, url, uploadedBy } = req.body;

        // Validate required fields
        if (!title || !description || !subject || !tag || !url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Update resource
        const updatedResource = await Resource.findByIdAndUpdate(
            id,
            { title, description, subject, tag, url, uploadedBy },
            { new: true }
        );

        if (!updatedResource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.json(updatedResource);
    } catch (error) {
        console.error('Error updating resource:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(chalk.green(`\n✅ Server is running on port ${PORT}\n`));
}); 