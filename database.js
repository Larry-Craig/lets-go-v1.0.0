const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('lets_go', 'root', 'cheboy2005', {
    host: 'localhost',
    dialect: 'mysql', // Ensure you are using the correct dialect
});

// Test the connection
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

// Export the sequelize instance
module.exports = sequelize;
