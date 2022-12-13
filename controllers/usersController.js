const express = require('express')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcrypt')
const passwordValidator = require('password-validator')

// create a schema validator and add properties
const schema = new passwordValidator();
schema
    .is().min(8) // minimum length of 8 characters
    .has().uppercase() // must have uppercase character
    .has().symbols(1) // must include one special character

// require the createUserToken method
const { createUserToken } = require('../middleware/auth')

// Routes: API Endpoints Supported
// GET all users (for testing) (Read)
router.get('/', async (req, res, next) => {
    try {
        const users = await User.find({})
        users ? res.status(200).json(users) : res.sendStatus(404)
    }
    catch(err) {
        next(err)
    }
})

// GET one user (Read)
router.get('/:userId', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId)
        user ? res.status(200).json(user) : res.sendStatus(404)
    }
    catch(err) {
        next(err)
    }
})

// POST one user (sign up) (Post)
router.post('/signup', async (req, res, next) => {
    try {
        // validation to check if the email already exists in the db
        const emailCheck = await User.findOne({ email: req.body.email })
        if (emailCheck) return res.status(400).send('Email is already in use')
        
        // validation to check if first name, last name, email, and password are not empty
        if (req.body.firstName.length === 0 || req.body.lastName.length === 0 || req.body.email.length === 0 || req.body.password.length === 0) {
            return res.status(400).send('Please fill in all fields')
        }

        // validation to check if the password contains 8 characters, 1 uppercase character, and 1 special character
        if (schema.validate(req.body.password) === false) {
            return res.status(400).send('Password must contain at least 8 characters, 1 uppercase character, and 1 special character')
        }

        // Note: Validation to check if the password and confirmation password match will be in the front-end (confirmation password will not be stored in model)

        // if all validation pass, the password will be hashed and salted by 10 rounds (standard)
        const password = await bcrypt.hash(req.body.password, 10)
        const newUser = await User.create({firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, password})
        res.status(201).json(newUser)
    }
    catch(err) {
        next(err)
    }
})

// POST one user (sign in) (Post)
// generate a token for authentication
router.post('/login', async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (user) {
            const token = createUserToken(req, user)
            res.json(token)
        }
        else {
            res.status(400).send('Invalid email or password')
        }
    }
    catch(err) {
        next(err)
    }
})

// export the routes
module.exports = router