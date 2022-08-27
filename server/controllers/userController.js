const User = require('../models/userModels');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ! get all the users
exports.getAllUsers = catchAsync(async (_req, res) => {
    const users = await User.find();
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

// ! get single user
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// ! create user
exports.createUser = (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'This route not yet define. Please use /singup endpoint.',
    });
};

// ! update user
exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// ! delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// exports.uploadImage = catchAsync(async (req, res) => {
//     const test = await Test.create(req.body);
//     res.status(201).json({
//         status: 'success',
//         data: {
//             test,
//         },
//     });
// });
