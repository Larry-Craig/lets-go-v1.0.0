const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const User = require('./User'); // Import User model
const sequelize = require('./database'); // Import Sequelize instance
const nodemailer = require('nodemailer'); // For sending emails
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static('../frontend'));

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Use your MySQL username
    password: 'cheboy2005', // Use your MySQL password
    database: 'lets_go'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database.');
});

// API endpoint to book a ride
app.post('/api/book', (req, res) => {
    const { pickup, dropoff } = req.body;
    const sql = 'INSERT INTO rides (pickup_location, dropoff_location) VALUES (?, ?)';
    db.query(sql, [pickup, dropoff], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Ride booked successfully!', rideId: result.insertId });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Session configuration
const sessionMiddleware = session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({
        db: sequelize
    })
});

app.use(sessionMiddleware);

// Sync database and create tables
sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
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
    const { username, password, email } = req.body; // Ensure email is included

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await User.create({ username, password: hashedPassword, email }); // Save email
        res.status(201).json({ message: 'User registered successfully!', userId: newUser.id });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error });
    }
});

// User Login
app.post('/api/login', async(req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user.id; // Store user ID in session
        res.json({ message: 'Login successful!' });
    } else {
        res.status(400).json({ message: 'Invalid password' });
    }
});

// Update Profile
app.post('/api/update-profile', isAuthenticated, async(req, res) => {
    const { newUsername, newPassword } = req.body;

    try {
        const user = await User.findByPk(req.session.userId);
        if (newUsername) {
            user.username = newUsername;
        }
        if (newPassword) {
            user.password = await bcrypt.hash(newPassword, 10);
        }
        await user.save();
        res.json({ message: 'Profile updated successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Profile update failed', error });
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

    // Logic to send password reset email
    const user = await User.findOne({ where: { email } }); // Ensure you have an email field in your User model
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // Set up nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email service
        auth: {
            user: 'your_email@gmail.com', // Your email
            pass: 'your_email_password', // Your email password
        },
    });

    const mailOptions = {
        from: 'your_email@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        text: 'Click the link to reset your password: <reset_link_here>',
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email', error });
        }
        res.json({ message: 'Password reset link sent to your email!' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing
module.exports = app; // Add this line to export the app