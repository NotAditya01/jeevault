const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jee_vault_uploads',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    format: 'pdf'
  }
});

// Create multer upload middleware
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary }; 