const express = require('express')
const router = express.Router()
const multer = require('multer');
const fs = require('fs').promises

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {


        const email = req.body.email ?? '';
        const directoryPath = 'public/Profile Pictures/' + email

        // Ensure the directory structure exists
        await fs.mkdir(directoryPath, { recursive: true })


        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Controllers
const {
    saveLocation, 
} = require('../controllers/user.controller.js')

const {testPost, testGet} = require('../controllers/test.controller.js')


router.route('/location').post(saveLocation)



router.route('/test').post(testPost)
router.route('/test').get(testGet)

// getRefferedUsers
module.exports = router