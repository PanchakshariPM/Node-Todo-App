const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const bcrypt = require('bcryptjs')

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 6,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email!' //Validator module for validating email and other parameters.
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
})

UserSchema.methods.toJSON = function () {
    var user = this;
    var userObj = user.toObject();

    return _.pick(userObj, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({ _id: user._id.toHexString(), access }, 'camelCaseSecretKey').toString();

    user.tokens.push({ access, token });

    return user.save().then(() => {
        return token
    })
};

UserSchema.methods.removeToken = function (token) {
    var user = this;

    return user.update({
        $pull: { //$pull gonna pull the specified array (in this case tokens specified below) and removes it from its parent obj.,
            tokens: { token }
        }
    })
};

UserSchema.statics.findByToken = function (token) {
    var Users = this;
    var decoded;

    try {
        decoded = jwt.verify(token, 'camelCaseSecretKey');
    } catch (e) {
        return Promise.reject();
    }

    return Users.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    })
};

// Someother method:

// UserSchema.statics.findByCredentials = function (req, res) {
//     var Users = this;

//     let password = req.body.password;
//     let email = req.body.email;

//     Users.findOne({ email }).then((user) => {
//         console.log(user);
//         if (!user) {
//             return res.status(404).send("User not found for entered this Credentials!");
//         }

//         bcrypt.compare(password, user.password, (err, result) => {
//             if (result) {
//                 return res.status(200).send({ user, message: 'Logged in Successfully!' })
//             } else if (err) {
//                 res.send({ err });
//             }
//         })
//     })

// };

UserSchema.statics.findByCredentials = function (email, password) {
    var Users = this;

    return Users.findOne({ email }).then((user) => {
        if (!user) {
            return Promise.reject()
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    return resolve(user)
                } else {
                    return reject(err)
                }
            })
        })
    })
};

UserSchema.pre('save', function (next) {
    var user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});

var Users = mongoose.model('Users', UserSchema)

module.exports = { Users }