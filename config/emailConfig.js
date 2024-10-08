const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure Nodemailer transport using your email service provider
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,  // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,  // Your email
        pass: process.env.EMAIL_PASS   // Your email password or app-specific password
    }
});

module.exports = transporter;
