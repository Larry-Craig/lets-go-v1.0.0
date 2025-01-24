require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all requests
app.use(express.json());
app.use(express.static('../frontend')); // Serve static files from the frontend directory

// Verify required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'SESSION_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        console.error(`Environment variable ${envVar} is not set.`);
        process.exit(1); // Exit if any required variable is missing
    }
});

// Create MySQL connection (for raw queries)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Connect to MySQL database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database.');
});

// Initialize Sequelize (ORM)
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Suppress SQL query logs for cleaner output
});

// Test Sequelize database connection
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL database with Sequelize.');
    } catch (error) {
        console.error('Unable to connect to the database with Sequelize:', error);
        process.exit(1);
    }
})();

// Define User model
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Define Ride model
const Ride = sequelize.define('Ride', {
    pickup_location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dropoff_location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Configure session middleware
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({
        db: sequelize,
    }),
});
app.use(sessionMiddleware);

// Sync Sequelize models with database
(async () => {
    try {
        await sequelize.sync();
        console.log('Database & tables created!');
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
})();

// Endpoint to check raw MySQL connection
app.get('/api/db-check', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (error, results) => {
        if (error) {
            console.error('Database connection failed:', error);
            return res.status(500).json({ message: 'Database connection failed', error: error.message });
        }
        res.status(200).json({ message: 'Database connection successful!', solution: results[0].solution });
    });
});

// Middleware for Authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    return res.status(403).json({ message: 'Unauthorized access' });
};

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password, email, name } = req.body;
    if (!username || !password || !email || !name) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashedPassword, email, name });
        res.status(201).json({ message: 'User registered successfully!', userId: newUser.id });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            res.json({ message: 'Login successful!' });
        } else {
            res.status(400).json({ message: 'Invalid password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// API endpoint to book a ride
app.post('/api/book', isAuthenticated, async (req, res) => {
    const { pickup, dropoff } = req.body;

    try {
        const ride = await Ride.create({ pickup_location: pickup, dropoff_location: dropoff });
        res.json({ message: 'Ride booked successfully!', rideId: ride.id });
    } catch (err) {
        res.status(500).json({ message: 'Error booking ride', error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing
module.exports = app;
