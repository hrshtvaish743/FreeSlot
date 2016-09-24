// app/models/user.js
// load the things we need

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var superuserSchema = mongoose.Schema({

    local            : {
        email        : {
            type: String,
            required: true
        },
        password     : {
            type: String,
            required: true
        },
        name         : {
            type: String,
            required: true
        },
        loginID      : {
            type: String
        },
        Phone     : {
            type: String,
            required: true
        },
        role : String,
        resetPasswordToken: String,
        resetPasswordExpires: Date
    }
});

// methods ======================
// generating a hash
superuserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
superuserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('superUser', superuserSchema);
