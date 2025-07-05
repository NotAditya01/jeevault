const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    fileUrl: {
        type: String,
        required: function() {
            return this.type === 'file';
        }
    },
    url: {
        type: String,
        required: function() {
            return this.type === 'url';
        }
    },
    type: {
        type: String,
        enum: ['file', 'url'],
        required: true
    },
    tag: {
        type: String,
        enum: ['notes', 'books'],
        required: true
    },
    uploadedBy: {
        type: String,
        required: false,
        default: 'Anonymous',
        trim: true
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

module.exports = mongoose.model('Resource', resourceSchema); 