const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        const admin = new User({
            username: 'admin',
            password: 'password123', // Change this in production
            isAdmin: true
        });

        await admin.save();
        console.log('Admin user created');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
