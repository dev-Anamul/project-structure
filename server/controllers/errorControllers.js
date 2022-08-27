const AppError = require('../utils/AppError');

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid Data : ${errors.join(' ')}`;
    return new AppError(message, 400);
};
const handleExpireTokenError = (err) => {
    const message = `Your token is already expired !! Please generate new token.. Error: ${err.message}`;
    return new AppError(message, 401);
};
const handleJwtError = (err) => {
    const { message } = err;
    return new AppError(message, 401);
};
const handleDuplicateNameDB = (err) => {
    const message = `Duplicate Field Value : "${err.keyValue.name}". Please try with another value`;
    return new AppError(message, 400);
};
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path} : ${err.value}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error('error 💥', err);

        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong here',
        });
    }
};

module.exports = (error, req, res, next) => {
    let err = error;
    err.statusCode = error.statusCode || 500;
    err.status = error.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        if (err.name === 'CastError') {
            err = handleCastErrorDB(err);
        }
        if (err.code === 11000) {
            err = handleDuplicateNameDB(err);
        }
        if (err.name === 'ValidationError') {
            err = handleValidationError(err);
        }
        if (err.name === 'JsonWebTokenError') {
            err = handleJwtError(err);
        }
        if (err.name === 'TokenExpiredError') {
            err = handleExpireTokenError(err);
        }
        sendErrorProd(err, res);
    }
    next();
};
