// load the things we need

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var superUserSchema = mongoose.Schema({
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
            type: String,
            unique: true
        },
        Phone     : {
            type: String,
            required: true
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date
});

// methods ======================
// generating a hash
superUserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
superUserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('superUser', superUserSchema);
