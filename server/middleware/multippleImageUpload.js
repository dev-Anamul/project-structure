/* eslint-disable comma-dangle */
// ! external dependencies
const multer = require('multer');
const sharp = require('sharp');

// ! internal dependencies
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ! multer storage
const multerStorage = multer.memoryStorage();

// ! file filter
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
};

// ! multer upload
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// ! upload multiple images fileds
exports.uploadMultipleImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);

// ! resize the image
exports.resizeMultipleImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // ! cover image
    req.body.imageCover = `cover-image-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/images/multiple/${req.body.imageCover}`);

    // ! images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (image, index) => {
            const filename = `image-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

            await sharp(image.buffer)
                .resize(500, 500)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/images/multiple/${filename}`);
            req.body.images.push(filename);
        })
    );
    next();
});
