require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors'); // Import CORS
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer'); // For sending emails

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Enable CORS for all requests
app.use(express.json());
app.use(express.static('../frontend')); // Serve static files from frontend directory

// Create MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Connect to MySQL database
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database.');
});

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
});

// Test database connection
sequelize.authenticate()
    .then(() => console.log('Connected to MySQL database with Sequelize.'))
    .catch(err => console.error('Unable to connect to the database:', err));

// User model
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
    name: { // Added name field
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Ride model
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

// Session configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your_secret_key', // Use a secure secret
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({
        db: sequelize,
    }),
});

app.use(sessionMiddleware);

// Sync database and create tables
sequelize.sync()
    .then(() => console.log('Database & tables created!'));

// Endpoint to check MySQL database connection
app.get('/api/db-check', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (error, results) => {
        if (error) {
            console.error('Database connection failed:', error);
            return res.status(500).json({ message: 'Database connection failed', error: error.message });
        }
        res.status(200).json({ message: 'Database connection successful!', solution: results[0].solution });
    });
});

// Middleware for Authentication Check
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    return res.status(403).json({ message: 'Unauthorized access' });
};

// User Registration
app.post('/api/register', async(req, res) => {
    const { username, password, email, name } = req.body; // Include name

    if (!username || !password || !email || !name) { // Check for all fields
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
app.post('/api/login', async(req, res) => {
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
app.post('/api/book', isAuthenticated, async(req, res) => {
    const { pickup, dropoff } = req.body;

    try {
        const ride = await Ride.create({ pickup_location: pickup, dropoff_location: dropoff });
        res.json({ message: 'Ride booked successfully!', rideId: ride.id });
    } catch (err) {
        res.status(500).json({ message: 'Error booking ride', error: err.message });
    }
});

// Update Profile
app.post('/api/update-profile', isAuthenticated, async(req, res) => {
    const { newUsername, newPassword, newName } = req.body; // Include newName

    try {
        const user = await User.findByPk(req.session.userId);
        if (newUsername) {
            user.username = newUsername;
        }
        if (newName) {
            user.name = newName; // Update name if provided
        }
        if (newPassword) {
            user.password = await bcrypt.hash(newPassword, 10);
        }
        await user.save();
        res.json({ message: 'Profile updated successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Profile update failed', error: error.message });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully!' });
});

// Password Reset Request
app.post('/api/request-password-reset', async(req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Set up nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use your email service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: 'Click the link to reset your password: <reset_link_here>',
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return res.status(500).json({ message: 'Error sending email', error });
            }
            res.json({ message: 'Password reset link sent to your email!' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error during password reset request', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing
module.exports = app;