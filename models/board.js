var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var boardSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    regno: {
        type: String,
        required: true
    },
    clubID: {
        type: String,
        required: true
    },
    phone : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    }
});

module.exports = student;
