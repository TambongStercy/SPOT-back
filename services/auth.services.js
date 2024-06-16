// authService.js
const userModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class authService {

    static async register(data) {
        const { name, phone, email, password, dateOfBirth } = data

        const existing = await userModel.findOne({ email: email })

        if (existing != null) throw new Error('Email is already used');


        const existingPhone = await userModel.findOne({ phone: phone })

        if (existingPhone) throw new Error('Phone Number already used');


        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);


        const user = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            dateOfBirth: dateOfBirth,
            phone: phone,
        })


        const token = await user.createToken()

        await user.save()

        return { user, token };
    }

    static async login(data) {
        const { email, password } = data

        const user = await userModel.findOne({ email: email })

        if (!user) throw new Error('User not found');

        const compareResult = bcrypt.compareSync(password, user.password)

        if (!compareResult) throw new Error('Invalid credentials');

        const token = await user.createToken()

        await user.save()

        return { user, token }
    }

    static async logout(data) {
        const { email, token } = data

        const user = await userModel.findOne({ email: email })

        user.deleteToken(token)
        await user.save()

        return { user, token }
    }
    // Other authentication-related business logic...
}

module.exports = authService;
