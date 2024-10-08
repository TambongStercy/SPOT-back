const cloudinary = require('../config/cloudinaryConfig');

// Service to upload a file to Cloudinary
exports.uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
            if (error) {
                throw new Error('Cloudinary upload failed');
            }
            return result;
        }).end(file.buffer); // Upload the file buffer (from multer)

        return result.secure_url;  // Return the URL of the uploaded image
    } catch (err) {
        throw new Error(`Error uploading to cloud: ${err.message}`);
    }
};
