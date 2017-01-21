// config/database.js
var url_mongo = 'mongodb://freeslot_write:' + process.env.FREESLOT_MONGO + '@ds147905.mlab.com:47905/freeslots';
module.exports = {

    'url' : url_mongo 

};
