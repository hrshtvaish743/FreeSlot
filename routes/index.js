var qs = require('querystring');
var http = require('http');
var request = require('request');
var express = require('express');
var curl = require('curlrequest')
var router = express.Router();

var regno = undefined;
var dob = undefined;
var mobile = undefined;
var campus = undefined;
var name = undefined;

var slots = new Array();

/*function find_length (slot, no) {
	var j = 0;
	while (no <= slot.length) {
		if (slot[no] == '+') {
			break;
		}
		j++;
		no++;
	}
	return j;
}*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FreeSlot' });
});
router.post('/', function (req, res, next) {
	if (!req.body.registerNo || !req.body.DOB || !req.body.phoneNo){
		res.send("Wrong Input");
	} else {
		regno = req.body.registerNo;
		dob = req.body.DOB;
		mobile = req.body.phoneNo;
		campus = req.body.campus;
		var options = { url: 'https://vitacademics-rel.herokuapp.com/api/v2/' + campus + '/login', data: 'regno='+ regno +'&dob='+ dob +'&mobile=' + mobile };
		curl.request(options, function (err, file) {
			name = JSON.parse(file).name;
			res.redirect('/refresh');
		});		
	}
});

router.get('/refresh', function(req, res, next) {
  res.render('update', { title: 'FreeSlot', name: name, registerNo: regno });
});

router.post('/refresh', function (req, res, next) {
	if (!regno || !dob || !mobile){
		res.send("Wrong Input");
	} else {
		var options = { url: 'https://vitacademics-rel.herokuapp.com/api/v2/' + campus + '/refresh', data: 'regno='+ regno +'&dob='+ dob +'&mobile=' + mobile };
		curl.request(options, function (err, buffer) {
		    var response = JSON.parse(buffer);
		    console.log(response.reg_no);
		    for (i = 0; ; i++) {
		    	if(response.courses[i] !== undefined){
		    		slots.push(response.courses[i].slot);
		    	} else {
		    		break;
		    	}
		    }
		    res.redirect('/update');
		});		
	}
});

module.exports = router;
