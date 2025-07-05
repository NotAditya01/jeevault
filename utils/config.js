const chalk = require('chalk');

// Define required environment variables
const requiredEnvVars = {
    // MongoDB
    MONGODB_URI: 'MongoDB connection string',
    
    // Admin credentials
    ADMIN_USERNAME: 'Admin username',
    ADMIN_PASSWORD: 'Admin password',
    
    // Server configuration
    PORT: 'Server port (default: 3000)'
};

// Define optional environment variables
const optionalEnvVars = {
    // Cloudinary configuration (optional but recommended for production)
    CLOUDINARY_CLOUD_NAME: 'dtgruon9i',
    CLOUDINARY_API_KEY: '165231835663976',
    CLOUDINARY_API_SECRET: 'JT92rPn64_HnnGR2uWfeeLwq-6E',
    
    // MongoDB connection options (optional)
    MONGODB_CONNECTION_TIMEOUT: 'MongoDB connection timeout in ms (default: 30000)',
    MONGODB_SOCKET_TIMEOUT: 'MongoDB socket timeout in ms (default: 45000)'
};

function validateConfig() {
    console.log(chalk.blue('\n🔍 Checking environment variables...\n'));
    
    let missingVars = [];
    let configuredVars = [];
    let optionalConfiguredVars = [];
    let optionalMissingVars = [];
    
    // Check each required variable
    for (const [key, description] of Object.entries(requiredEnvVars)) {
        if (key === 'PORT' && !process.env[key]) {
            configuredVars.push({
                key,
                value: '3000 (default)',
                description
            });
            continue;
        }
        
        if (!process.env[key]) {
            missingVars.push({ key, description });
        } else {
           
            const isSensitive = key.includes('PASSWORD') || 
                              key.includes('SECRET') || 
                              key.includes('API_KEY') ||
                              key.includes('URI');
            
            configuredVars.push({
                key,
                value: isSensitive ? '[SET]' : process.env[key],
                description
            });
        }
    }
    
    // Check optional variables
    for (const [key, description] of Object.entries(optionalEnvVars)) {
        if (process.env[key]) {
            const isSensitive = key.includes('PASSWORD') || 
                              key.includes('SECRET') || 
                              key.includes('API_KEY');
            
            optionalConfiguredVars.push({
                key,
                value: isSensitive ? '[SET]' : process.env[key],
                description
            });
        } else {
            optionalMissingVars.push({ key, description });
        }
    }

    if (configuredVars.length > 0) {
        console.log(chalk.green('✅ Configured Required Variables:'));
        configuredVars.forEach(({ key, value, description }) => {
            console.log(chalk.green(`   ${key}: ${value}`));
            console.log(chalk.gray(`      Description: ${description}`));
        });
        console.log('');
    }
    
    if (optionalConfiguredVars.length > 0) {
        console.log(chalk.green('✅ Configured Optional Variables:'));
        optionalConfiguredVars.forEach(({ key, value, description }) => {
            console.log(chalk.green(`   ${key}: ${value}`));
            console.log(chalk.gray(`      Description: ${description}`));
        });
        console.log('');
    }
    
    if (optionalMissingVars.length > 0) {
        console.log(chalk.yellow('⚠️ Missing Optional Variables:'));
        optionalMissingVars.forEach(({ key, description }) => {
            console.log(chalk.yellow(`   ${key}`));
            console.log(chalk.gray(`      Description: ${description}`));
        });
        console.log('');
    }
    
    // Log missing variables
    if (missingVars.length > 0) {
        console.log(chalk.red('❌ Missing Required Variables:'));
        missingVars.forEach(({ key, description }) => {
            console.log(chalk.red(`   ${key}`));
            console.log(chalk.gray(`      Description: ${description}`));
        });
        console.log('');
        
    
        console.log(chalk.yellow('📝 Add these to your .env file:'));
        console.log(chalk.yellow('\n```'));
        missingVars.forEach(({ key }) => {
            console.log(chalk.yellow(`${key}=your_${key.toLowerCase()}_here`));
        });
        console.log(chalk.yellow('```\n'));
        
        throw new Error('Missing required environment variables');
    }
    
    console.log(chalk.green('✅ All required environment variables are configured!\n'));
    return true;
}

// Get MongoDB connection options
function getMongoDbOptions() {
    return {
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '30000'),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
        connectTimeoutMS: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '30000'),
        retryWrites: true,
        maxPoolSize: 10,
        minPoolSize: 1
    };
}

// Export configuration
module.exports = {
    validateConfig,
    getMongoDbOptions,
    config: {
        port: process.env.PORT || 3000,
        mongodbUri: process.env.MONGODB_URI,
        admin: {
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD
        },
        cloudinary: {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            apiSecret: process.env.CLOUDINARY_API_SECRET
        }
    }
}; 