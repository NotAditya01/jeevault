const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['Physics', 'Chemistry', 'Math']
    },
    chapter: {
        type: String,
        required: true
    },
    fileURL: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'file'
    },
    uploadedBy: {
        type: String,
        required: true
    },
    approved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure either filePath or externalLink is provided
resourceSchema.pre('save', function(next) {
    if (!this.filePath && !this.externalLink) {
        next(new Error('Either file path or external link must be provided'));
    }
    next();
});

module.exports = mongoose.model('Resource', resourceSchema); 