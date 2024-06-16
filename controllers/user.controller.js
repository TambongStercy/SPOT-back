const userService = require('../services/auth.services')

// Functoin to login/connect a user
const saveLocation = async (req, res) => {
    try {

        return res.status(200).json({ message: 'user location' })

    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
module.exports = { saveLocation }