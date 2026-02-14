
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const util = require('util');

dotenv.config();

const uri = process.env.MONGO_URI;
console.log(`Testing connection to: ${uri}`);

const connect = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected successfully!');
        process.exit(0);
    } catch (err) {
        const fs = require('fs');
        fs.writeFileSync('debug_error.log', util.inspect(err));
        console.error('Connection failed, written to log.');
        process.exit(1);
    }
};

connect();
