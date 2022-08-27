const express = require('express')
const router = express.Router()
// use requireToken as an inline middleware to ensure that user has a token before sending the response
// will automatically add the user to the req object as a property or will error out
const { requireToken } = require('../middleware/auth')

const Project = require('../models/Project')

// Routes: API Endpoints Supported

// GET all projects (Read)
router.get('/', async (req, res, next) => {
    try {
        const projects = await Project.find({}).populate('owner')
        projects ? res.status(200).json(projects) : res.sendStatus(404)
    }
    catch(err) {
        next(err)
    }
})

// GET all projects for a user (Read)
router.get('/:userId', async (req, res, next) => {
    try {
        const projects = await Project.find({}).populate('owner')
        const filteredProjectsArr = projects.filter((project) => project.owner._id.toString() === req.params.userId)
        filteredReviewsArr.length !== 0 ? res.status(200).json(filteredProjectsArr) : res.sendStatus(404)
    }
    catch(err) {
        next(err)
    }
})

// POST new project (Post)
router.post('/', async (req, res, next) => {
    try {
        const newProject = await Project.create(req.body)
        res.status(201).json(newProject)
    }
    catch(err) {
        next(err)
    }
})

// PATCH project (Update)
router.patch('/:projectId', async (req, res, next) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(req.params.projectId, req.body, {new: true})
        updatedProject ? res.status(200).json(updatedProject) : res.sendStatus(404)
    }
    catch(err) {
        next(err)
    }
})

// DELETE project (Destroy)
router.delete('/:projectId', async (req, res, next) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.projectId)
        
        deletedProject ? res.status(200).json(deletedProject) : res.sendStatus(404)
    }
    catch(err) {
        next(err)
    }
})

// export the routes
module.exports = router