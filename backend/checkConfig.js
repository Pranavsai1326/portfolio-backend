const mongoose = require('mongoose');
const dotenv = require('dotenv');
const About = require('./models/About');

dotenv.config();

const checkConfig = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const config = await About.findOne();
        console.log('Current Config:', config);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkConfig();
