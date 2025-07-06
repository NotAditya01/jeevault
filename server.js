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

// Add connection parameters directly to the URI if not already present
let mongoUri = config.mongodbUri;
if (!mongoUri.includes('?')) {
    mongoUri += '?retryWrites=true&w=majority';
}

// Create a cached connection variable
let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        // Connect with updated options
        const connection = await mongoose.connect(mongoUri, getMongoDbOptions());
        console.log(chalk.green('✅ Connected to MongoDB\n'));
        
        cachedConnection = connection;
        return connection;
    } catch (err) {
        console.error(chalk.red('❌ MongoDB connection error:'), err);
        throw err;
    }
}

// Initialize database connection before starting the server
async function initializeServer() {
    try {
        // Connect to MongoDB first
        await connectToDatabase();
        
        // Add connection event listeners for better error handling
        mongoose.connection.on('error', (err) => {
            console.error(chalk.red(`MongoDB connection error: ${err}`));
            // Attempt to reconnect
            setTimeout(() => {
                connectToDatabase().catch(console.error);
            }, 5000);
        });

        mongoose.connection.on('disconnected', () => {
            console.log(chalk.yellow('MongoDB disconnected. Attempting to reconnect...'));
            setTimeout(() => {
                connectToDatabase().catch(console.error);
            }, 5000);
        });

        mongoose.connection.on('reconnected', () => {
            console.log(chalk.green('MongoDB reconnected'));
        });

        // Start listening only after successful database connection
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(chalk.green(`✅ Server is running on port ${port}`));
        });
    } catch (error) {
        console.error(chalk.red('Failed to initialize server:'), error);
        process.exit(1);
    }
}

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

        // Create new resource with timeout handling
        const resource = new Resource({
            title,
            description,
            subject,
            tag,
            url,
            uploadedBy: uploadedBy || 'Anonymous',
            approved: false
        });

        // Set timeout for save operation
        const savePromise = resource.save();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Save operation timed out')), 15000)
        );

        const savedResource = await Promise.race([savePromise, timeoutPromise]);
        
        console.log(chalk.green(`✅ Resource saved to database: ${savedResource._id}`));
        res.status(201).json({ 
            success: true, 
            message: 'Your resource has been submitted. It will appear after admin approval.',
            resource: savedResource
        });
    } catch (error) {
        console.error(chalk.red(`❌ Error creating resource: ${error.message}`));
        console.error(chalk.red(error.stack));
        
        // Send appropriate error message based on error type
        const errorMessage = error.message === 'Save operation timed out'
            ? 'Request timed out. Please try again.'
            : 'Failed to create resource. Please try again later.';
            
        res.status(500).json({ error: errorMessage });
    }
});

// Get all resources (approved only)
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await Resource.find({ approved: true })
            .sort({ createdAt: -1 })
            .maxTimeMS(10000); // Set maximum execution time
        res.json(resources);
    } catch (error) {
        console.error(chalk.red(`❌ Error fetching resources: ${error.message}`));
        res.status(500).json({ error: 'Failed to fetch resources. Please try again later.' });
    }
});

// Admin routes
app.get('/api/admin/resources', authenticateAdmin, async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const resources = await Resource.find({ 
            approved: status === 'approved'
        })
        .sort({ createdAt: -1 })
        .maxTimeMS(10000); // Set maximum execution time
        
        console.log(chalk.blue(`📋 Fetching ${status} resources`));
        console.log(chalk.gray(`Found ${resources.length} resources`));
        
        res.json(resources);
    } catch (error) {
        console.error(chalk.red(`❌ Error fetching admin resources: ${error.message}`));
        res.status(500).json({ error: 'Failed to fetch resources. Please try again later.' });
    }
});

// Approve/reject resource
app.patch('/api/admin/resources/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const resource = await Resource.findById(id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        resource.approved = action === 'approve';
        await resource.save();
        
        console.log(chalk.green(`✅ Resource ${id} ${action}d`));
        res.json({ success: true });
    } catch (error) {
        console.error(chalk.red(`❌ Error updating resource: ${error.message}`));
        res.status(500).json({ error: 'Failed to update resource' });
    }
});

// Delete resource
app.delete('/api/admin/resources/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await Resource.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        console.log(chalk.green(`✅ Resource ${id} deleted`));
        res.json({ success: true });
    } catch (error) {
        console.error(chalk.red(`❌ Error deleting resource: ${error.message}`));
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

// Initialize the server
initializeServer(); 