/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable comma-dangle */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendingEmail = require('../utils/email');

// ! create jwt token
const signToken = (id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
};

// ! allowed filds to update
const newObj = (obj, ...allowedFields) => {
    const returnObj = {};

    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            returnObj[el] = obj[el];
        }
    });
    return returnObj;
};

// ! create jwt and send to the user
const createJwtAndSend = (user, statusCode, res) => {
    const currentUser = user;
    const token = signToken(user._id);

    // const cookieOptions = {
    //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //     httpOnly: true,
    // };

    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    // res.cookie('jwt', token, cookieOptions);

    // ! hide password and active from response object not database
    currentUser.password = undefined;
    currentUser.active = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: currentUser,
        },
    });
};

// ! signup user
exports.singnUp = catchAsync(async (req, res) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        photo: req.body.photo,
        passwordConfirm: req.body.passwordConfirm,
        userName: req.body.userName,
    });

    createJwtAndSend(newUser, 201, res);
});

// ! login user
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // ! 1 check email or password is exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // ! 2. check if user exits
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.checkCorrectPassword(password, user.password))) {
        return next(new AppError('Incorrect Email or Password', 401));
    }

    // ! finally loged in users
    createJwtAndSend(user, 200, res);
});

// ! logout user
// ! protect routes
exports.protect = catchAsync(async (req, res, next) => {
    // ! 1. getting token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        [, token] = req.headers.authorization.split(' ');
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access.', 401));
    }

    // ! token verification
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // ! check if user exists
    const freshUser = await User.findById(decode.id);

    if (!freshUser) {
        return next(new AppError('The user belonging this token does no longer exists', 401));
    }

    // ! check if user change password affer issued jwt token
    if (freshUser.changePasswordAfterCreateJwt(decode.iat)) {
        return next(new AppError('User recently changed password !! Please loged in again', 401));
    }

    // ! finally execute next middleware
    req.user = freshUser;
    next();
});

// ! restrict to
// eslint-disable-next-line prettier/prettier
exports.restrictTO =
    (...role) =>
    (req, _res, next) => {
        if (!role.includes(req.user.role)) {
            return next(new AppError('Your have no permission to perform this action', 403));
        }
        next();
    };

// ! forgot password function
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // ! 1. find user with users email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('There is no user with this email', 404));
    }

    // ! 2. generate randon token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // ! 3. send it to user's email
    const resetUrl = `${req.protocol}://${req.get(
        // eslint-disable-next-line comma-dangle
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password ? Submit a patch request with your new password and passwordConfirmed to : ${resetUrl}.\n If not please ignore this email.`;

    try {
        await sendingEmail({
            email: user.email,
            subject: 'Your password reset token will expire within 5 minutes',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token send to email!',
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.resetTokenExpiresIn = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            // eslint-disable-next-line prettier/prettier
            new AppError('There was an error with the sending email ! Try agail later.', 500)
        );
    }
});

// ! reset password function
exports.resetPassword = catchAsync(async (req, res, next) => {
    // ! get user based on token
    const hasedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hasedToken,
        resetTokenExpiresIn: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError('Token is Invalid or has expired', 400));
    }

    // ! if there is user reset password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.resetTokenExpiresIn = undefined;
    await user.save();

    // ! log in user sending token
    createJwtAndSend(user, 200, res);
});

// ? only for logged in users
// ! update password
exports.updatePassword = catchAsync(async (req, res, next) => {
    // ! 1. find ueser from the collection
    const user = await User.findById(req.user.id).select('+password');

    // ! compare current password with user.password
    if (!(await user.checkCorrectPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Current password is not correct', 401));
    }
    // ! update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // ! login user sending jwt
    createJwtAndSend(user, 200, res);
});

// ! update me
exports.updateMe = catchAsync(async (req, res, next) => {
    console.log(req.file);
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This is route is not for password updates. Please use /updateMypassword ',
                400
            )
        );
    }
    const filterObj = newObj(req.body, 'name', 'email');
    if (req.file) {
        filterObj.photo = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObj, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

// ! get logged in user
exports.getMe = (req, _res, next) => {
    req.params.id = req.user.id;
    next();
};

// ! delete logged in user
exports.deleteMe = catchAsync(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
