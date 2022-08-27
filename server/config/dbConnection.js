/* eslint-disable comma-dangle */
// ! external dependencies
const mongoose = require('mongoose');

// ! database url
let DB = process.env.MONGO_URL;
DB = DB.replace('<USER>', process.env.MONGO_USER).replace('<PASS>', process.env.MONGO_PASS);

// ! Db connection
const connecWithRetry = async () => {
    try {
        await mongoose.connect(DB, {
            useNewUrlParser: true,
        });
    } catch (error) {
        setTimeout(() => {
            connecWithRetry();
        }, 5000);
    }
};

module.exports = connecWithRetry;
