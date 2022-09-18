const express = require('express')
const router = express.Router()
// use requireToken as an inline middleware to ensure that user has a token before sending the response
// will automatically add the user to the req object as a property or will error out
const { requireToken } = require('../middleware/auth')
const Project = require('../models/Project')
const crypto = require('crypto') // to generate random string
const sharp = require('sharp') // to resize images

// S3 Client - AWS SDK (communicate with s3 bucket)
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl, S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");


// Need dotenv since we are using env variables
const dotenv = require('dotenv')
dotenv.config()

// Function that generates random hexadecimal string that will be essentially unguessable
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
})

// File upload middleware
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
upload.single('image')

// Routes: API Endpoints Supported

// GET all projects (Read)
router.get('/', async (req, res, next) => {
    try {
        const projects = await Project.find({}).populate('owner')
        if (projects) {
            for (let project of projects) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: project.image,
                }
                // GetObjectCommand to create image url 
                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
                project.imageUrl = url
            }
            res.status(200).json(projects) 
        }
        else {
            res.sendStatus(404)
        }
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
        if (filteredProjectsArr.length !== 0) {
            for (let project of filteredProjectsArr) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: project.image
                }
                // GetObjectCommand to create image url
                const command = new GetObjectCommand(getObjectParams)
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
                project.imageUrl = url
            }
            res.status(200).json(filteredProjectsArr)
        }
        else {
            return res.sendStatus(404)
        }
    }
    catch(err) {
        next(err)
    }
})

// POST new project (Post)
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        // console.log("req.body", req.body)
        // console.log("req.file", req.file)

        // resize image
        const buffer = await sharp(req.file.buffer).resize({height: 540, width: 960}).toBuffer()

        const imageName = randomImageName()
        const params = {
            Bucket: bucketName,
            Key: imageName, // image name that doesn't cause collision
            Body: buffer,
            ContentType: req.file.mimetype,
        }
        const command = new PutObjectCommand(params)
        await s3.send(command)

        const newProject = await Project.create({
            name: req.body.name,
            description: req.body.description,
            projectUrl: req.body.projectUrl,
            // owner: req.body.owner,
            technologies: JSON.parse(req.body.technologies), // req.body.technologies is received as a string
            image: imageName
        })
        res.status(201).json(newProject)
    }
    catch(err) {
        next(err)
    }
})

// PATCH project (Update)
router.patch('/:projectId', upload.single('image'), async (req, res, next) => {
    try {
        const updatedProject = await Project.findById(req.params.projectId)
        if (updatedProject) {
            // resize image
            const buffer = await sharp(req.file.buffer).resize({height: 540, width: 960}).toBuffer()

            const params = {
                Bucket: bucketName,
                Key: updatedProject.image, // image name that matches existing to overwrite it
                Body: buffer,
                ContentType: req.file.mimetype,
            }
            const command = new PutObjectCommand(params)
            await s3.send(command)
    
            const newProject = await Project.findByIdAndUpdate(
            req.params.projectId,    
            {
                name: req.body.name,
                description: req.body.description,
                url: req.body.url,
                owner: req.body.owner,
                technologies: JSON.parse(req.body.technologies),
                image: updatedProject.image
            },
            {new: true})
        }
        else {
            res.sendStatus(404)
        }
    }
    catch(err) {
        next(err)
    }
})

// DELETE project (Delete)
router.delete('/:projectId', async (req, res, next) => {
    try {
        // 1) find project to delete
        const deletedProject = await Project.findById(req.params.projectId)
        if (deletedProject) {
            const params = {
                Bucket: bucketName,
                Key: deletedProject.image
            }
            
            // 2) delete image from aws s3
            const command = new DeleteObjectCommand(params)
            await s3.send(command)

            // 3) delete from mongo db
            await Project.findByIdAndDelete(req.params.projectId) 
            res.status(200).json(deletedProject) 
        }
        else {
            res.sendStatus(404)
        }
    }
    catch(err) {
        next(err)
    }
})

// export the routes
module.exports = router