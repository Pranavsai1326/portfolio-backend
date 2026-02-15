const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    issuer: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    link: {
        type: String, // Optional URL to verify
    },
    issueDate: {
        type: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model('Certification', certificationSchema);
