
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ username: 'admin' });
        if (user) {
            console.log('Admin user FOUND in database.');
            console.log('Username:', user.username);
            console.log('Hashed Password:', user.password);
            console.log('Is Admin:', user.isAdmin);
        } else {
            console.log('Admin user NOT FOUND in database.');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
