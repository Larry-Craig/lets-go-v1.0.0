const db = require('../database'); // Adjusted path to database.js
const User = require('../User'); // Adjusted path to User.js
beforeAll(async() => {
    await db.sync({ force: true }); // Reset the database before tests
});

afterAll(async() => {
    await db.close(); // Close the database connection
});

describe('User Model', () => {
    it('should create a new user', async() => {
        const user = await User.create({ username: 'testuser', password: 'hashedpass' });
        expect(user.username).toBe('testuser');
    });

    it('should not allow duplicate usernames', async() => {
        await User.create({ username: 'testuser', password: 'hashedpass' });
        await expect(User.create({ username: 'testuser', password: 'anotherpass' }))
            .rejects.toThrow();
    });
});