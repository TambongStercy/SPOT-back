require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const app = express()

// Initial configurations
app.use(cookieParser());
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Mongo DB connection
// const uri = process.env.MONGODB_URI

const uri = 'mongodb://127.0.0.1:27017/SPOTT'

mongoose.connect(uri)
    .then(con => {
        console.log('DB connection successfull ')
    })
    .catch(e => {
        console.log('Error with the db connection ' + e)
    })

// Routes
const userRoutes = require('./routes/userRoutes.js')
const authRoutes = require('./routes/authRoutes.js')
const spotRoutes = require('./routes/spotRoutes.js')



app.use(express.static('public'));
app.use('/frames', express.static('frames'));

app.get('/', (req, res) => {
    res.send("Welcome to spott backend")
})

app.use('/api/user', userRoutes)
app.use('/api/auth', authRoutes)
app.user('/api/spots', spotRoutes)


app.get('*',(req ,res)=>{
    res.send("Not Found")
})


// Your function that runs at the beginning
async function initializeServer() {
    console.log('Server is initializing...');

    // downloadPpDrive()
}

// Call the initialization function
initializeServer()
    .then(() => {
        // Set up your routes and other server configurations
        app.listen(5000, () => {
            console.log('Server is running on port 5000');
        });
    })
    .catch(error => {
        console.error('Error during server initialization:', error);
    });



