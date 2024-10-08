const multer = require('multer');

// Multer configuration for file uploads
const storage = multer.memoryStorage();  // Store files in memory temporarily
const upload = multer({ storage });

module.exports = upload;
