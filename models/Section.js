const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    sectionId: { // e.g., 'about', 'services', 'projects'
        type: String,
        required: true,
        unique: true
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
