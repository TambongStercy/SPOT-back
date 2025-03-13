const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use the MongoDB Atlas connection string from environment variables
        const mongoURI =  'mongodb://localhost:27017/SPOTT';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
