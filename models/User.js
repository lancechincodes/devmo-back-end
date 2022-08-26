const mongoose = require('mongoose')
const { isEmail } = require('validator')

// create the user schema
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // 'email' must be unique (if 2 users use the same mail, you'll get a duplicate key error)
        validate: [ isEmail, 'Invalid email']
    },
    password: {
        type: String,
        required: true
    }
},
{
    timestamps: true,
    // creating a virtual that will automatically remove password field any time toJSON method is used
    // even though the field is deleted by the virtual, it remains safe in the database
    toJSON: {
        virtuals: true,
        // ret is the returned Mongoose document
        transform: (_doc, ret) => {
            delete ret.password
            return ret
        }
    }
})

// instantiate the model and give it a name
const User = mongoose.model('User', UserSchema)

// export the model
module.exports = User