const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
    },

    // Optional — Google OAuth users don't have a password
    password: {
        type: String,
        required: false,
        default: null
    },

    googleId: {
        type: String,
        default: null
    },

    avatar: {
        type: String,
        default: null
    },

    name: {
        type: String,
        default: null
    }
}, { timestamps: true })

const userModel = mongoose.model("users", userSchema)

module.exports = userModel