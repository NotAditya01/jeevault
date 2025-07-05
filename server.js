require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const { upload } = require('./utils/cloudinary');
const Resource = require('./models/Resource');
const fs = require('fs');

// Debug environment variables
console.log('Admin username from env:', process.env.ADMIN_USERNAME);
console.log('Admin password from env:', process.env.ADMIN_PASSWORD ? '[SET]' : '[NOT SET]');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Increase payload size limit for JSON requests
app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: true, limit: '40mb' }));

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

// Upload route for both PDF files and URLs
app.post('/api/resources', upload.single('file'), async (req, res) => {
    try {
        const { title, description, type, subject, tag } = req.body;

        if (!title || !description || !type || !subject || !tag) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const resource = new Resource({
            title,
            description,
            type,
            subject,
            tag
        });

        if (type === 'file') {
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
        res.status(500).json({ error: 'Failed to create resource' });
    }
});

// Get approved resources
app.get('/resources', async (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 