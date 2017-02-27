var config = require('../config/config');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var student = require('../models/student');
var Club = require('../models/club');
var curl = require('curlrequest');
var superUser = require('../models/superuser');
var AccountFunctions = require('../functions/AccountFunctions');
var config = require('../config/config');
var https = require('https');
var Temp = require('../models/temp.js');
var Login = require('../api/login.js');
var Scraper = require('../api/scraper.js');
const cache = require('memory-cache');


var name = new Map;
var reg_no = new Map;
var id = new Map;
var slots = new Map;
var BusySlotsFinal = new Map;
var FreeSlots = new Map;


module.exports = {
    Login: function(req, res, clubName) {
        if (!req.body.registerNo || !req.body.DOB || !req.body.phoneNo || !clubName) {
            console.log(clubName);
            res.render('form.ejs', {
                name: clubName,
                id: req.params.id,
                message: 'Some error occurred. Please try again!'
            });
        } else {
            newTemp = new Temp;
            newTemp.regno = req.body.registerNo;
            newTemp.dob = req.body.DOB;
            newTemp.mobile = req.body.phoneNo;
            newTemp.club_id = req.params.id;
            const data = {
                reg_no: req.body.registerNo.toUpperCase(),
                dob: req.body.DOB,
                mobile: req.body.phoneNo || null
            };

            const onGet = function(err, response) {
                newTemp.name = response.name;
                var status = response.status.code;
                if (status != 0) {
                    if (status === 12) {
                        res.render('form.ejs', {
                            name: clubName,
                            id: req.params.id,
                            message: 'Invalid Credentials! Please Try Again!'
                        });
                    } else if (status === 11) {
                        res.render('form.ejs', {
                            name: clubName,
                            id: req.params.id,
                            message: 'Session Timed Out!!'
                        });
                    } else if (status === 89) {
                        res.render('form.ejs', {
                            name: clubName,
                            id: req.params.id,
                            message: 'VIT Servers are Down. Please Try After some Time!!'
                        });
                    } else {
                        res.send("Some Error Occured. Please try again!");
                    }
                } else {
                    newTemp.save(function(err) {
                        if (err) throw err;
                    });
                    res.redirect('/student/' + req.params.id + '/' + req.body.registerNo + '/refresh');
                }
            };
            Login.get(data, onGet);
        }
    },

    Update : function (req, res, student) {
      const data = {
        reg_no: student.regno.toUpperCase(),
        dob: student.dob,
        mobile: student.mobile || null
      };
      const onGet = function (err, response) {
        res.json(response);
      };
      Scraper.get(data, onGet);
    }
}
