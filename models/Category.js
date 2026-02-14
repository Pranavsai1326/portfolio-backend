const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['skill', 'project'],
        required: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
