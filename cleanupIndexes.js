const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const Category = require('./models/Category');

        try {
            await Category.collection.dropIndex('name_1');
            console.log('Dropped name_1 index');
        } catch (e) {
            console.log('Index name_1 not found or already dropped');
        }

        // Optional: clear categories to start fresh if migration failed mid-way
        // await Category.deleteMany({});
        // console.log('Cleared existing categories');

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
