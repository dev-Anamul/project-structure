/* eslint-disable no-underscore-dangle */
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ! if we don't need to resize the image, we can use the following code:
// const multerStorage = multer.diskStorage({
//     destination: (_req, _file, cb) => {
//         cb(null, 'public/images/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//     },
// });

// ! if we need to resize the image, we can use the following code:
const multerStorage = multer.memoryStorage();

// ! file filter
const multerFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserImage = upload.single('photo');

// ! resize the image
exports.resizeProfilePhoto = catchAsync(async (req, _res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/images/users/${req.file.filename}`);
    next();
});
