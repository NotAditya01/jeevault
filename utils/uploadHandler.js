const multer = require("multer");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
try {
  if (!fs.existsSync(uploadDir)) {
    console.log(chalk.yellow(`Creating uploads directory at ${uploadDir}`));
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(chalk.green(`✅ Uploads directory created successfully`));
  } else {
    console.log(chalk.green(`✅ Uploads directory exists at ${uploadDir}`));
  }
  
  // Create a .gitkeep file to ensure the directory is tracked by git
  const gitkeepPath = path.join(uploadDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, 'This file ensures the uploads directory is tracked by git');
    console.log(chalk.green(`✅ Created .gitkeep file in uploads directory`));
  }
  
  // Ensure the directory is writable
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log(chalk.green(`✅ Uploads directory is writable`));
} catch (error) {
  console.error(chalk.red(`❌ Error setting up uploads directory: ${error.message}`));
  console.error(chalk.red(`This may cause file uploads to fail`));
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Double-check directory exists before trying to save
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        console.error(chalk.red(`❌ Failed to create uploads directory: ${error.message}`));
        return cb(new Error("Upload directory unavailable"), null);
      }
    }
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = uniqueName + path.extname(file.originalname);
    console.log(chalk.blue(`📄 Generating filename for upload: ${fileName}`));
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    console.log(chalk.green(`✅ Valid file type: ${file.mimetype}`));
    cb(null, true);
  } else {
    console.log(chalk.red(`❌ Invalid file type: ${file.mimetype}`));
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = { upload }; 