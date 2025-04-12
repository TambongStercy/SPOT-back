const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
    const serviceAccount = require(process.env.FCM_SERVICE_ACCOUNT_KEY_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;
