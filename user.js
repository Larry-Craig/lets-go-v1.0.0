const { Model, DataTypes } = require('sequelize');
const sequelize = require('./database'); // Adjusted to the correct path

class User extends Model {}

User.init({
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
}, { sequelize, modelName: 'User' });

module.exports = User;