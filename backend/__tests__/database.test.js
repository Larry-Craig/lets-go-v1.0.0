const db = require('./database'); // Adjusted path to database.js
const User = require('../User'); // Adjusted path to User.js

beforeAll(async() => {
    await db.sync({ force: true }); // Reset the database before tests
});

afterAll(async() => {
    await db.close(); // Close the database connection
});

describe('User Model', () => {
    it('should create a new user', async() => {
        const user = await User.create({
            username: 'testuser',
            password: 'hashedpass',
            email: 'test@example.com' // Ensure you include the email
        });
        expect(user.username).toBe('testuser');
    });

    it('should not allow duplicate usernames', async() => {
        await User.create({
            username: 'testuser',
            password: 'hashedpass',
            email: 'test@example.com' // Include the email here as well
        });
        await expect(User.create({
            username: 'testuser',
            password: 'anotherpass',
            email: 'another@example.com' // Include the email here
        })).rejects.toThrow(); // This should throw an error due to unique constraint
    });
});