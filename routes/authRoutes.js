const express = require('express')
const router = express.Router()

// Controllers
const {
    register, 
    login, 
    logout,
} = require('../controllers/auth.controller.js')



router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').post(logout)


// getRefferedUsers
module.exports = router