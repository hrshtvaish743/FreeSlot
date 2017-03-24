var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var tempSchema = mongoose.Schema({

    regno: String,
    dob: String,
    mobile: String,
    club_id : String,
    name : String,
    email : String,
    phone : String

});

// create the model for users and expose it to our app
module.exports = mongoose.model('temp', tempSchema);
