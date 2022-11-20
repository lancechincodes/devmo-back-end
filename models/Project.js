const mongoose = require('mongoose')

// create the project schema
const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    projectUrl: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    technologies: [{
        type: String,
        required: true
    }],
    image: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    githubRepo: {
        type: String
    },
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

// instantiate the model and give it a name
const Project = mongoose.model('Project', ProjectSchema)

// export the model
module.exports = Project