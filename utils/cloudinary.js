const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const chalk = require('chalk');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer
 * @param {string} filename - Original filename for reference
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadPdfToCloudinary = async (buffer, filename) => {
  try {
    console.log(chalk.blue(`🚀 Uploading file to Cloudinary: ${filename}`));
    
    return new Promise((resolve, reject) => {
      // Create a readable stream from buffer
      const stream = Readable.from(buffer);
      
      // Create upload stream to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // For PDFs and other non-image files
          folder: 'jee-vault-pdfs',
          public_id: `pdf-${Date.now()}`, // Unique name
          format: 'pdf',
          type: 'upload'
        },
        (error, result) => {
          if (error) {
            console.error(chalk.red(`❌ Cloudinary upload failed: ${error.message}`));
            return reject(error);
          }
          
          console.log(chalk.green(`✅ File uploaded to Cloudinary: ${result.secure_url}`));
          resolve(result);
        }
      );
      
      // Pipe the readable stream to the upload stream
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error(chalk.red(`❌ Error in uploadPdfToCloudinary: ${error.message}`));
    throw error;
  }
};

/**
 * Check if Cloudinary is properly configured
 * @returns {boolean} - True if configured, false otherwise
 */
const isCloudinaryConfigured = () => {
  const isConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;
  
  if (!isConfigured) {
    console.log(chalk.yellow('⚠️ Cloudinary is not configured. PDF uploads will not work in production.'));
    console.log(chalk.yellow('⚠️ Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'));
  } else {
    console.log(chalk.green('✅ Cloudinary configuration detected'));
  }
  
  return isConfigured;
};

module.exports = {
  uploadPdfToCloudinary,
  isCloudinaryConfigured
}; 