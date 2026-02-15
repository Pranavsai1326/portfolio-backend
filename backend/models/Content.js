const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    type: {
        type: String, // 'accomplishment', 'strength', 'typing_role'
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
