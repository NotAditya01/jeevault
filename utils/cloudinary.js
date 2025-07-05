const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const chalk = require('chalk');
const { config } = require('./config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
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
    
    // Check if we have a valid buffer
    if (!buffer || buffer.length === 0) {
      console.error(chalk.red('❌ Invalid or empty buffer provided for upload'));
      throw new Error('Invalid or empty file buffer');
    }
    
    console.log(chalk.blue(`📊 Buffer size: ${buffer.length} bytes`));
    
    // Use a simpler approach with buffer upload instead of streaming
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
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
      ).end(buffer);
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
    config.cloudinary.cloudName && 
    config.cloudinary.apiKey && 
    config.cloudinary.apiSecret;
  
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