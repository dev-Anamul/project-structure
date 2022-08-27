/* eslint-disable comma-dangle */
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Schema, model } = require('mongoose');

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: [true, 'User name is required'],
            trim: true,
            unique: [true, 'User name is already taken'],
            lowercase: true,
            max: [20, 'User name is too long'],
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            max: [32, 'Name is too long'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: [true, 'Email is already taken'],
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, 'Email is not valid'],
        },
        password: {
            type: String,
            required: [true, 'please enter password'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, 'please confirm password'],
            validate: {
                validator(el) {
                    return el === this.password;
                },
                message: 'Passwords are not the same',
            },
        },
        photo: {
            type: String,
            default: 'default.png',
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        passwordChangeAT: {
            type: Date,
        },
        passwordResetToken: {
            type: String,
        },
        passwordResetExpires: {
            type: Date,
        },
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// ! hast password before saving user to db and dleting passwordConfirm field
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

// ! set pswword change at property if change password
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangeAT = Date.now() - 2000;
    return next();
});

// ! compare password with hashed password
userSchema.methods.checkCorrectPassword = async function (candidatePassword, userPassword) {
    const passCheckResult = await bcrypt.compare(candidatePassword, userPassword);
    return passCheckResult;
};

// ! change password after issuing jwt token
userSchema.methods.changePasswordAfterCreateJwt = function (jwtTimeStap) {
    if (this.passwordChangeAT) {
        const passChanged = parseInt(this.passwordChangeAT.getTime() / 1000, 10);
        return passChanged > jwtTimeStap;
    }
    return false;
};

// ! generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// ! query middleware not show active false users
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// ! export user model
const User = model('User', userSchema);
module.exports = User;
