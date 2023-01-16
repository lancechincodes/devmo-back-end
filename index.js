// Basic config for server 
require('dotenv').config // knows what process.env.DATABASE_url is
const express = require('express')
const app = express()
require('./db/connection') // check if db is running immediately
app.set('port', process.env.PORT || 8000)

// Implement cors to avoid cors (cross-origin response sharing) error
const cors = require('cors')
app.use(cors())

// Middleware to parse through data 
app.use(express.json())
app.use(express.urlencoded( {extended: true }))

// Log each request as it comes in for debugging 
const requestLogger = require('./middleware/request_logger')
app.use(requestLogger)

// Routes (controllers)
const usersController = require('./controllers/usersController')
app.use('/api/users', usersController)

const projectsController = require('./controllers/projectsController')
app.use('/api/projects', projectsController)

app.use("/", (req, res) => {
    res.send('Welcome to the Devmo API page!')
})

// Error handling 
const { handleErrors } = require('./middleware/custom_errors')
app.use(handleErrors)

// Listener for requests and to start server
app.listen(app.get('port'), () => {
    console.log('On port: ' + app.get('port') + ' 🎸')
})