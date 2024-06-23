const userService = require('../services/user.services')

// Functoin to login/connect a user
const saveLocation = async (req, res) => {
    try {

        const userData = { ...req.body }

        const { userId } = userData
        const { lon, lat } = userData;  // Destructure lon and lat from userData
        const location = { lon, lat };  // Create a new object with lon and lat


        if (!lon || !lat) {
            return res.status(400).json({ message: 'Please all the fields are required' })
        }

        await userService.updateUserById(userId, location)

        return res.status(200).json({ message: 'user location successfully saved' })

    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

module.exports = { saveLocation }