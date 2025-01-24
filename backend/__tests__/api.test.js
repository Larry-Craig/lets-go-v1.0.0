const request = require('supertest');
const app = require('../server'); // Ensure this path is correct
const db = require('../database'); // Import your database connection
const User = require('../User'); // Import your User model

beforeEach(async() => {
    await db.sync({ force: true }); // Reset the database before each test
});

afterAll(async() => {
    await db.close(); // Close the database connection
});

describe('API Endpoints', () => {
    it('should register a new user', async() => {
        const response = await request(app)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('User registered successfully!');
    });

    it('should log in the user', async() => {
        await request(app) // Ensure the user is registered before logging in
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });

        const response = await request(app)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Login successful!');
    });

    it('should not log in with invalid credentials', async() => {
        await request(app) // Ensure the user is registered
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });

        const response = await request(app)
            .post('/api/login')
            .send({ username: 'testuser', password: 'wrongpass' });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid password');
    });

    it('should return an error for non-existent user', async() => {
        const response = await request(app)
            .post('/api/login')
            .send({ username: 'nonexistentuser', password: 'testpass' });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('User not found');
    });

    it('should persist the user in the database', async() => {
        await request(app)
            .post('/api/register')
            .send({ username: 'testuser', password: 'testpass' });

        const user = await User.findOne({ where: { username: 'testuser' } });
        expect(user).toBeTruthy(); // Check if user exists
    });
});