var config = require('../config/config');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var Student = require('../models/student');
var Club = require('../models/club');
var AccountFunctions = require('../functions/AccountFunctions');
var config = require('../config/config');
var https = require('https');
var Temp = require('../models/temp.js');
var Login = require('../api/login.js');
var Scraper = require('../api/scraper.js');
const cache = require('memory-cache');
const path = require('path');


module.exports = {
    Login: function(req, res, clubName) {
        if (!req.body.registerNo || !req.body.DOB || !req.body.phoneNo || !clubName) {
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

    GetData : function (req, res, student) {
      const data = {
        reg_no: student.regno.toUpperCase(),
        dob: student.dob,
        mobile: student.mobile || null
      };
      const onGet = function (err, response) {
        var status = response.status.code;
        if (status !== 0) {
            if (status === 12) {
              req.flash('ErrorMsg', 'Invalid Credentials! Please Try Again!')
              res.redirect('/student/' + req.params.id);
            } else if (status === 11) {
              req.flash('ErrorMsg', 'Session Timed Out!!')
              res.redirect('/student/' + req.params.id);
            } else if (status === 89) {
              req.flash('ErrorMsg', 'VIT Servers are Down. Please Try After some Time!!')
              res.redirect('/student/' + req.params.id);
            }
        } else {
            var Slots = new Array();

            for (i = 0; i < response.courses.length; i++) {
                if (response.courses[i]) {
                    Slots.push(response.courses[i].slot);
                }
            }

            var BusySlots = new Array();
            for (var value of Slots) {
                if (value !== null) {
                    BusySlots = split_slots(BusySlots, value);
                }
            }

            var NumberedBusySlots = new Array();
            for (var value of BusySlots) {
                if (value[0] === 'L') {
                    NumberedBusySlots.push(LabSlots[value]);
                } else if (value[0] === 'T') {
                    NumberedBusySlots.push(Tslots[value]);
                } else {
                    NumberedBusySlots.push(TheorySlots[value][0]);
                    NumberedBusySlots.push(TheorySlots[value][1]);
                }
            }
        }

        var NumberedFreeSlots = AllSlots.filter(function(slot) {
            return NumberedBusySlots.indexOf(slot) < 0
        });

        var newStud = new Student;
        newStud.name = student.name;
        newStud.regno = response.reg_no;
        newStud.freeslots = NumberedFreeSlots;
        newStud.clubID = req.params.id;

        Student.find({
            'regno': response.reg_no,
            'clubID': req.params.id
        }, function(err, stud) {
            if (err) throw err;
            if (Object.keys(stud).length === 0) {
                newStud.save(function(err) {
                    if (err) throw err;
                    console.log('Data created!');
                    res.render('updated.ejs', {
                        name: student.name,
                        registerNo: response.reg_no,
                        slots: NumberedFreeSlots
                    });
                });
            } else {
                deleteDoc(response.reg_no, req.params.id);
                newStud.save(function(err) {
                    if (err) throw err;
                    console.log('Data updated!');
                    res.render('updated.ejs', {
                        name: student.name,
                        registerNo: response.reg_no,
                        slots: NumberedFreeSlots
                    });
                });
            }
        });
      };
      Scraper.get(data, onGet);
    }
}

function split_slots(BusySlots, slot) {
    var index = 0;
    var length = undefined;
    for (var i = 0; i < slot.length; i++) {
        if (slot[i] === '+') {
            length = find_length(slot, index);
            BusySlots.push(slot.substr(index, length));
            index = i + 1;
        }
    }
    BusySlots.push(slot.substr(index));
    return BusySlots;
}

function find_length(slt, index) {
    var length = 0;
    while (index <= slt.length) {
        if (slt[index] == '+') {
            break;
        }
        length++;
        index++;
    }
    return length;
}

var deleteDoc = function(regno, id) {
    Student.find({
        'regno': regno,
        'clubID': id
    }).remove().exec();
    console.log('Data Deleted!');
}

var LabSlots = {
    "L1": "1",
    "L2": "2",
    "L3": "3",
    "L4": "4",
    "L5": "5",
    "L6": "6",
    "L7": "7",
    "L8": "8",
    "L9": "9",
    "L10": "10",
    "L11": "11",
    "L12": "12",
    "L13": "13",
    "L14": "14",
    "L15": "15",
    "L16": "16",
    "L17": "17",
    "L18": "18",
    "L19": "19",
    "L20": "20",
    "L21": "21",
    "L22": "22",
    "L23": "23",
    "L24": "24",
    "L25": "25",
    "L26": "26",
    "L27": "27",
    "L28": "28",
    "L29": "29",
    "L30": "30",
    "L31": "31",
    "L32": "32",
    "L33": "33",
    "L34": "34",
    "L35": "35",
    "L36": "36",
    "L37": "37",
    "L38": "38",
    "L39": "39",
    "L40": "40",
    "L41": "41",
    "L42": "42",
    "L43": "43",
    "L44": "44",
    "L45": "45",
    "L46": "46",
    "L47": "47",
    "L48": "48",
    "L49": "49",
    "L50": "50",
    "L51": "51",
    "L52": "52",
    "L53": "53",
    "L54": "54",
    "L55": "55",
    "L56": "56",
    "L57": "57",
    "L58": "58",
    "L59": "59",
    "L60": "60"
};

var AllSlots = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60"];

var TheorySlots = {
    "A1": ["1", "14"],
    "B1": ["7", "20"],
    "C1": ["13", "26"],
    "D1": ["3", "19"],
    "E1": ["9", "25"],
    "F1": ["2", "15"],
    "G1": ["8", "21"],
    "A2": ["31", "44"],
    "B2": ["37", "50"],
    "C2": ["43", "56"],
    "D2": ["33", "49"],
    "E2": ["39", "55"],
    "F2": ["32", "45"],
    "G2": ["38", "51"]
};

var Tslots = {
    "TA1": "27",
    "TA2": "57",
    "TB1": "4",
    "TB2": "34",
    "TC1": "10",
    "TC2": "40",
    "TD1": "29",
    "TD2": "46",
    "TE1": "22",
    "TE2": "52",
    "TF1": "28",
    "TF2": "58",
    "TG1": "5",
    "TG2": "35",
    "TAA1": "11",
    "TCC1": "23",
    "TAA2": "41",
    "TBB2": "47",
    "TCC2": "53",
    "TDD2": "59"
};
