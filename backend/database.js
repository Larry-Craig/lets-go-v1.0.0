const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('lets_go', 'root', 'cheboy2005', {
    host: 'localhost',
    dialect: 'mysql', // Ensure you are using the correct dialect
});

module.exports = sequelize;
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;