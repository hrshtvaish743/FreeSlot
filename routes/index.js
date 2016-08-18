var qs = require('querystring');
var http = require('http');
var request = require('request');
var express = require('express');
var curl = require('curlrequest')
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FreeSlot' });
});
router.post('/', function (req, res, next) {
	if (!req.body.registerNo || !req.body.DOB || !req.body.phoneNo){
		res.send("Wrong Input");
	} else {
		//res.send("registerNo :" + req.body.registerNo + "Date Of Birth : " + req.body.DOB + "\nPhone No: " + req.body.phoneNo + "\nCampus: " + req.body.campus);
		var options = { url: 'https://vitacademics-rel.herokuapp.com/api/v2/' + req.body.campus + '/login', data: 'regno=14BCE0124&dob=22101995&mobile=9838652428' };
		curl.request(options, function (err, file) {
		    console.log(file);
		    res.send(toString(file));
		});		
	}
})

module.exports = router;
