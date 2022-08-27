/* eslint-disable comma-dangle */

// ! external dependencies
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// ! internal dependencies
const userRouter = require('./routers/userRouter');

// ! initializations app
const app = express();

dotenv.config({ path: './config/config.env' });

// ! internal dependencies
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorControllers');

// ! node environment
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ! cors
app.use(
    cors({
        origin: '*',
    })
);

// ! body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// !serving static file
app.use(express.static(path.join(__dirname, 'public')));

// ! mounted routers to app
app.use('/api/v1/users', userRouter);

// ! common route
app.all('*', (req, res, next) => {
    next(
        new AppError(
            `Can't find ${req.protocol}://${req.hostname}${req.originalUrl} in this server`,
            404
        )
    );
});

// ! global error handling function

app.use(globalErrorHandler);

module.exports = app;
