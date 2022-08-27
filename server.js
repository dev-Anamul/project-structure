// !  external dependecies
const dotenv = require('dotenv');

// ! configure environment file
dotenv.config({ path: './server/config/config.env' });

// ! internal dependencies
const connecWithRetry = require('./server/config/dbConnection');

// ! unhandle exception handle here
process.on('uncaughtException', (err) => {
    console.log(err);
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// ! require app
const app = require('./server/app');

// ! connecto to the database
connecWithRetry()
    .then(() => {
        console.log('DB connection successful!');
    })
    .catch((err) => {
        console.log(err);
        console.log('DB connection failed! Retrying...');
    });

console.log(process.env.NODE_ENV);
// ! sever is runing here
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// ! unhandle promise rejection handle here
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
