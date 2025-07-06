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

function validateConfig() {
    console.log(chalk.blue('\n🔍 Checking environment variables...\n'));
    
    let missingVars = [];
    let configuredVars = [];
    
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

    if (configuredVars.length > 0) {
        console.log(chalk.green('✅ Configured Variables:'));
        configuredVars.forEach(({ key, value, description }) => {
            console.log(chalk.green(`   ${key}: ${value}`));
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
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
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
        }
    }
}; 