// app/routes.js
var student = require('../models/student');
var Club    = require('../models/club');
var curl = require('curlrequest')

var regno = undefined;
var dob = undefined;
var mobile = undefined;
var campus = undefined;
var name = undefined;
var reg_no = undefined;
var id = undefined;
var slots = new Array();
var BusySlots = new Array();
var BusySlotsFinal = new Array();
var FreeSlots = new Array();
var clubMap = new Array();

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/admin', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {
            message: req.flash('loginMessage')
        });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {
            message: req.flash('signupMessage')
        });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/registered', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =========================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
      student.find({ 'clubID' : req.user.local.loginID}, function(err, students) {
        res.render('profile.ejs', {
            students : students,
            user: req.user // get the user out of session and pass to template
        });
      });
    });
    app.get('/registered', isLoggedIn, function(req, res) {
        res.render('registered.ejs', {
            user: req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/admin');
    });



    //TIMETABLE

    app.get('/', function(req, res, next) {
        res.render('home.ejs');
    });
    app.post('/student/:id', function(req, res, next) {
        if (!req.body.registerNo || !req.body.DOB || !req.body.phoneNo) {
            res.redirect('/');
        } else {
            regno = req.body.registerNo;
            dob = req.body.DOB;
            mobile = req.body.phoneNo;
            campus = req.body.campus;
            var options = {
                url: 'https://vitacademics-rel.herokuapp.com/api/v2/vellore/login',
                data: 'regno=' + regno + '&dob=' + dob + '&mobile=' + mobile
            };
            curl.request(options, function(err, file) {
                name = JSON.parse(file).name;
                reg_no = JSON.parse(file).reg_no;
                res.redirect('/refresh');
            });
        }
    });

    app.get('/student/:id', function(req, res, next) {
      id = req.params.id;
      res.render('form.ejs',{id:id});
    });

    app.get('/refresh', function(req, res, next) {
        res.render('update', {
            name: name,
            registerNo: reg_no
        });
    });

    app.post('/refresh', function(req, res, next) {
        if (!regno || !dob || !mobile) {
            res.redirect('/');
        } else {
            var options = {
                url: 'https://vitacademics-rel.herokuapp.com/api/v2/vellore/refresh',
                data: 'regno=' + regno + '&dob=' + dob + '&mobile=' + mobile
            };
            curl.request(options, function(err, buffer) {
                var response = JSON.parse(buffer);
                console.log(response.reg_no);
                for (i = 0;; i++) {
                    if (response.courses[i] !== undefined) {
                        slots.push(response.courses[i].slot);
                    } else {
                        break;
                    }
                }
                res.redirect('/update');
            });
        }
    });


    app.get('/update', function(req, res, next) {
        if (regno === undefined) {
            res.redirect('/');
        } else {
            for (var value of slots) {
                if (value !== null) {
                    split_slots(value);
                }
            }
            for (var value of BusySlots) {
                if (value[0] === 'L') {
                    BusySlotsFinal.push(LabSlots[value]);
                } else if (value[0] === 'T') {
                    BusySlotsFinal.push(Tslots[value]);
                } else {
                    BusySlotsFinal.push(TheorySlots[value][0]);
                    BusySlotsFinal.push(TheorySlots[value][1]);
                }
            }
            FreeSlots = AllSlots.filter(function(x) {
                return BusySlotsFinal.indexOf(x) < 0
            });
            var newStud = student({
                name: name,
                regno: regno,
                freeslots: FreeSlots,
                clubID: id
            });
            student.find({
                regno: regno
            }, function(err, student) {
                if (err) throw err;
                if (!student) {
                    newStud.save(function(err) {
                        if (err) throw err;
                        console.log('Data created!');
                    });
                } else {
                    if(student.clubID === id){
                      deleteDoc(regno);
                    }
                    newStud.save(function(err) {
                        if (err) throw err;
                        console.log('Data updated!');
                        id = undefined;
                    });
                }
            })

        }
        res.render('updated.ejs', {
            name: name,
            registerNo: reg_no
        });
    });

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/admin');
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

function split_slots(slot) {
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
}

var deleteDoc = function(regno) {
    student.find({
        regno: regno
    }).remove().exec();
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
