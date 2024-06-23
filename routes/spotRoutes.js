const express = require('express')
const router = express.Router()

// Controllers
const spotController = require('../controllers/spot.controller.js')


router.post('/', spotController.createSpot);
router.put('/:id', spotController.updateSpot);
router.delete('/:id', spotController.deleteSpot);
router.get('/', spotController.findSpots);

// getRefferedUsers
module.exports = router