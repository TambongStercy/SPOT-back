const authService = require('../services/auth.services')

// Functoin to login/connect a user
const login = async (req, res) => {
    try {
        const userData = { ...req.body }
        const { email, password } = userData

        if (!email || !password) {
            return res.status(400).json({ message: 'Please all the fields are required' })
        }

        const { user, token } = await authService.login(userData);


        const userSend = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
        }

        return res.status(200).json({ message: 'User connected successfully', token, user: userSend })


    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

// Funcion to register a user into the system
const register = async (req, res) => {
    try {
        const userData = { ...req.body }
        const { name, phone, email, password, dateOfBirth } = userData


        if (!name || !phone || !email || !password || !dateOfBirth) {
            return res.status(400).json({ message: "Please all the fields are required" })
        }

        const { user, token } = await authService.register(userData);

        console.log(user.token);


        return res.status(200).json({ message: "User information save successfully", token, id: user.id })

    }
    catch (e) {
        console.log(e)
        return res.status(500).json({ message: "Server error." })
    }
}

// Function to disconnect a user from its current session
const logout = async (req, res) => {
    try {
        const userData = { ...req.body }

        await authService.logout(userData)

        return res.status(200).json({ message: 'logout successful' })
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

module.exports = { login, register, logout }