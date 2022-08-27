/* eslint-disable comma-dangle */
// ! external dependencies
const express = require('express');

// ! internal dependencies
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { uploadUserImage, resizeProfilePhoto } = require('../middleware/singleImageUpload');
// const {
//     uploadMultipleImages,
//     resizeMultipleImages,
// } = require('../middleware/multippleImageUpload');
// ! initializations router
const router = express.Router();

// ! user routes
router.post('/signup', uploadUserImage, resizeProfilePhoto, authController.singnUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// ! those routes are protected by token
router.use(authController.protect);

router.get('/me', authController.getMe, userController.getUser);
// ! specific routes for logged in users
router.patch('/updateMyPassword', authController.updatePassword);

router.patch('/updateMe', uploadUserImage, resizeProfilePhoto, authController.updateMe);

router.delete('/deleteMe', authController.deleteMe);

// ? those routes are only specific for admin
router.use(authController.restrictTO('admin'));

// ! specific routes for admin
router.route('/').get(userController.getAllUsers).post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

// ! exports the router
module.exports = router;
