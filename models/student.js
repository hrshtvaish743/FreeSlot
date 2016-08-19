var mongoose = require('mongoose');

mongoose.connect('mongodb://freeslot_write:FreeslotDataBase@ds147905.mlab.com:47905/freeslots');
var Schema = mongoose.Schema;
var studSchema = new Schema({
    name: String,
    regno: {
        type: String,
        required: true,
        unique: true
    },
    freeslots: [Number],
    created_at: Date,
    updated_at: Date
});

var student = mongoose.model('StudentData', studSchema);
studSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at)
        this.created_at = currentDate;

    next();
});
module.exports = student;