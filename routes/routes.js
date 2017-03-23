var student = require('../models/student');
var Club = require('../models/club');
var curl = require('curlrequest');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var superUser = require('../models/superuser');
var AccountFunctions = require('../functions/AccountFunctions');
var TimeTableFunctions = require('../functions/TimeTableFunctions');
var config = require('../config/config');
var https = require('https');
var Temp = require('../models/temp.js');
const cache = require('memory-cache');


var name = new Map;
var reg_no = new Map;
var id = new Map;
var clubName = new Map;
var slots = new Map;
var BusySlotsFinal = new Map;
var FreeSlots = new Map;
var SECRET = process.env.FREESLOT_GOOGLE_SECRET;



module.exports = function(app, passport) {
    // =====================================
    // HOME PAGE ===========================
    // =====================================
    app.get('/', function(req, res, next) {
        res.render('index.ejs');
    });

    // =====================================
    // Admin login signup page =============
    // =====================================

    app.get('/admin', function(req, res) {
        res.render('admin.ejs', {
            message: req.flash('message')
        }); // load the admin.ejs file
    });

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
    app.post('/signup', function(req, res, next) {
        verifyRecaptcha(req.body["g-recaptcha-response"], function(success) {
            if (success) {
                return next(); // do registration using params in req.body
            } else {
                res.render('signup.ejs', {
                    message: 'Please Fill Captcha!'
                }); //  take them back to the previous page
            }
        });
    }, passport.authenticate('local-signup', {
        successRedirect: '/registered', // redirect to the secure registered section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    //Page to land after Registration
    app.get('/registered', isLoggedIn, function(req, res) {
        res.render('registered.ejs', {
            user: req.user // get the user out of session and pass to template
        });
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
        successRedirect: '/admin/home', // redirect to the secure home section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));


    app.get('/admin/forgot-password', function(req, res) {
        res.render('forgot.ejs', {
            user: req.user,
            message: req.flash('forgotMessage')
        });
    });

    app.post('/admin/forgot-password', function(req, res, next) {
        AccountFunctions.ForgotPasswordTokenRequest(req, res);
    });


    app.get('/reset/:token', function(req, res) {
        AccountFunctions.ForgotPasswordTokenVerification(req, res);
    });

    app.post('/reset/:token', function(req, res) {
        AccountFunctions.ForgotPasswordReset(req, res);
    });



    // =====================================
    // Admin SECTION =======================
    // =====================================

    app.get('/get-data', isLoggedIn, function(req, res) {
        student.find({
            'clubID': req.session.clubID
        }, function(err, list) {
            res.json(list);
        });
    });

    app.get('/admin/:action', isLoggedIn, function(req, res) {
        if (req.params.action == 'home') {
            student.find({
                'clubID': req.user.local.loginID
            }, function(err, students) {
                req.session.clubID = req.user.local.loginID;
                res.render('home.ejs', {
                    students: students,
                    user: req.user // get the user out of session and pass to template
                });
            });
        } else if (req.params.action == 'profile') {
            res.render('profile.ejs', {
                user: req.user,
                message: req.flash('updateProfile')
            });
        } else if (req.params.action == 'change-password') {
            res.render('change-password.ejs', {
                user: req.user,
                message: req.flash('changePassMessage')
            });
        } else if (req.params.action == 'delete') {
            student.find({
                'clubID': req.session.clubID
            }, function(err, students) {
                if (err) throw err;
                res.render('delete.ejs', {
                    students: students,
                    user: req.user // get the user out of session and pass to template
                });
            });
        } else if (req.params.action == 'allot') {
            res.render('allot.ejs');
        } else if (req.params.action == 'display') {
            res.render('display.ejs');
        } else if (req.params.action == 'find-free') {
            res.render('find-free.ejs');
        } else if (req.params.action == 'call-meeting') {
            res.render('meeting.ejs', {
                user: req.user,
                message: req.flash('meetingMessage')
            });
        } else if (req.params.action == 'send-message') {
            res.render('send-msg.ejs', {
                user: req.user
            });
        } else res.redirect('/admin/home');
    });

    app.post('/admin/:action', isLoggedIn, function(req, res) {
        if (req.params.action == 'profile') {
            AccountFunctions.UpdateProfile(req, res);
        } else if (req.params.action == 'change-password') {
            AccountFunctions.ChangePassword(req, res);
        } else if (req.params.action == 'delete') {
            student.findOne({
                'clubID': req.session.clubID,
                'regno': req.body.regno
            }, function(err, student) {
                if (err) throw err;
                if (!student) {
                    res.send('Data Not Found!!')
                } else {
                    deleteDoc(student.regno, student.clubID);
                    res.send('Deleted!!');
                }
            });
        } else if (req.params.action == 'mail-meeting') {
            student.findOne({
                'clubID': req.session.clubID,
                'regno': req.body.regno
            }, function(err, stud) {
                if (err) throw err;
                if (!stud) {
                    res.json({
                        status: 404,
                        message: 'Data Not Found!'
                    });
                } else if (stud.email) {
                    Club.findOne({
                        'loginID': req.session.clubID
                    }, function(err, club) {
                        if (err) throw err;
                        if (!club) {
                            res.json({
                                status: 404,
                                message: 'Data Not Found!'
                            });
                        } else {
                            var smtpTransport = nodemailer.createTransport({
                                service: 'Gmail',
                                auth: {
                                    user: config.email,
                                    pass: config.password
                                }
                            });
                            var mailOptions = {
                                to: stud.email,
                                from: 'FreeSlot',
                                subject: club.name + ' has called for a meeting!',
                                text: 'Hello ' + stud.name + ',\n' + club.name + ' has called for a meeting.\n\n' +
                                    'Venue: ' + req.body.venue +
                                    '\nDate: ' + req.body.date +
                                    '\nTime: ' + req.body.time +
                                    '\n\nThe meeting is called by ' + req.body.name +
                                    '\n\nMessage from the caller: ' + req.body.message +
                                    '\n\n\nThank You\nTeam FreeSlot'
                            };
                            smtpTransport.sendMail(mailOptions, function(err, info) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        status: 0,
                                        message: 'Some Error occurred!',
                                        name: stud.name,
                                        regno : stud.regno
                                    });
                                } else {
                                    res.json({
                                        status: 1,
                                        message: 'Mail Sent!',
                                        name: stud.name,
                                        regno : stud.regno
                                    });
                                }

                            });
                        }
                    });
                } else {
                    res.json({
                        status: 0,
                        message: 'Email address not updated!',
                        name: stud.name,
                        regno : stud.regno
                    });
                }
            });
        } else if (req.params.action == 'send-message') {
            student.findOne({
                'clubID': req.session.clubID,
                'regno': req.body.regno
            }, function(err, stud) {
                if (err) throw err;
                if (!stud) {
                    res.json({
                        status: 404,
                        message: 'Data Not Found!'
                    });
                } else if (stud.email) {
                    Club.findOne({
                        'loginID': req.session.clubID
                    }, function(err, club) {
                        if (err) throw err;
                        if (!club) {
                            res.json({
                                status: 404,
                                message: 'Data Not Found!'
                            });
                        } else {
                            var smtpTransport = nodemailer.createTransport({
                                service: 'Gmail',
                                auth: {
                                    user: config.email,
                                    pass: config.password
                                }
                            });
                            var mailOptions = {
                                to: stud.email,
                                from: 'FreeSlot',
                                subject: 'Message from ' + club.name,
                                text: 'Hello ' + stud.name + ',\nYou have a message from ' + club.name + '.' +
                                    '\n\nSent by: ' + req.body.name +
                                    '\n\nMessage: \n\n' + req.body.message +
                                    '\n\n\nThank You\nTeam FreeSlot'
                            };
                            smtpTransport.sendMail(mailOptions, function(err, info) {
                                if (err) {
                                    console.log(err);
                                    res.json({
                                        status: 0,
                                        message: 'Some Error occurred!',
                                        name: stud.name,
                                        regno : stud.regno
                                    });
                                } else {
                                    /*https.get('https://control.msg91.com/api/sendhttp.php?authkey=146100ABpiUitK58d3ca54&mobiles=9952552526&message=Test&sender=ABCDEF&route=4&country=91', function(res){
                                      console.log(res);
                                    });*/
                                    res.json({
                                        status: 1,
                                        message: 'Mail Sent!',
                                        name: stud.name,
                                        regno : stud.regno
                                    });
                                }
                            });
                        }
                    });
                } else {
                    res.json({
                        status: 0,
                        message: 'Email address not updated!',
                        name: stud.name,
                        regno : stud.regno
                    });
                }
            });
        } else res.redirect('/admin/home');
    });


    //==============================================
    //============= Super user section =============
    //==============================================

    app.get('/superuser/login', function(req, res) {
        res.render('superUserLogin.ejs', {
            message: req.flash('superMessage')
        });
    });

    app.post('/superuser/login', passport.authenticate('super-login', {
        successRedirect: '/superuser/home',
        failureRedirect: '/superuser/login',
        failureFlash: true
    }));

    app.get('/superuser/:action', isSuperLoggedIn, function(req, res) {
        if (req.params.action == 'home') {
            Club.find({}, function(err, club) {
                if (err) throw err;
                res.render('superhome.ejs', {
                    user: req.user,
                    reg: club
                });
            });
        } else if (req.params.action == 'verify') {
            User.find({
                'local.verified': false
            }, function(err, club) {
                if (err) throw err;
                if (!club || club[0] == undefined) {
                    res.render('verify.ejs', {
                        user: req.user,
                        message: 'All accounts are verified!',
                        users: null
                    });
                } else {
                    console.log(req.user);
                    res.render('verify.ejs', {
                        user: req.user,
                        message: 'These Users have pending verification: ',
                        users: club
                    });
                }
            });
        } else if (req.params.action == 'change-password') {
            res.render('super-change-password.ejs', {
                user: req.user,
                message: req.flash('changePassMessage')
            });
        } else {
            res.redirect('/superuser/home');
        }
    });

    app.post('/superuser/:action', isSuperLoggedIn, function(req, res) {
        if (req.params.action == 'verify') {
            AccountFunctions.VerifyAccount(req, res);
        } else if (req.params.action == 'delete') {
            User.findOneAndRemove({
                'local.RepRegno': req.body.regno
            }, function(err, user) {
                if (err) throw err;
                if (!user) res.send('No user found!');
                else {
                    Club.findOneAndRemove({
                        'regno': req.body.regno
                    }, function(err, club) {
                        if (err) throw err;
                        if (!club) res.send('Club not found');
                        else {
                          res.send('Club and user Deleted!');
                        }
                    });

                }
            });
        } else if (req.params.action == 'change-password') {
            async.waterfall([
                function(done) {
                    superUser.findOne({
                        'local.role': 'superadmin'
                    }, function(err, user) {
                        if (!user) {
                            req.flash('changePassMessage', 'User Not Found.');
                            return res.redirect('/superuser/change-password');
                        }
                        if (!user.validPassword(req.body.current)) {
                            req.flash('changePassMessage', 'Wrong Password!')
                            return res.redirect('/superuser/change-password');
                        } else {
                            user.local.password = user.generateHash(req.body.new);
                            user.save(function(err) {
                                if (err) throw err;
                                console.log('user saved');
                                req.logIn(user, function(err) {
                                    done(err, user);
                                });
                            });
                        }
                    });
                },
                function(user, done) {
                    req.flash('changePassMessage', 'Success! Your password has been changed.');
                    done();
                }
            ], function(err) {
                res.redirect('/superuser/change-password');
            });
        }
    });



    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        req.flash('message', "You're logged out Successfully!");
        res.redirect('/admin');
    });

    app.get('/superlogout', function(req, res) {
        req.logout();
        req.session.name = undefined;
        req.flash('message', "You're logged out Successfully!");
        res.redirect('/admin');
    });


    //================================================
    //============ Time table update section =========
    //================================================

    app.get('/student/:id', function(req, res, next) {
        Club.findOne({
            'loginID': req.params.id,
            'verified': true
        }, function(err, name) {
            if (err) throw err;
            if (!name)
                res.render('notfound.ejs', {
                    message: 'No Club/Chapter Associated with this ID Found!! Please contact your Club/Chapter\'s Admin.'
                });
            else {

                clubName.set(req.params.id, name.name);
                res.render('form.ejs', {
                    name: name.name,
                    message: req.flash('ErrorMsg')
                });
            }
        });
    });

    app.post('/student/:id', function(req, res, next) {
        verifyRecaptcha(req.body["g-recaptcha-response"], function(success) {
            if (success) {
                return next();
            } else {
                res.render('form.ejs', {
                    name: clubName.get(req.params.id),
                    id: req.params.id,
                    message: 'Please Fill Captcha!'
                });
            }
        });
    }, function(req, res) {
        TimeTableFunctions.Login(req, res, clubName.get(req.params.id));
    });

    /*app.post('/student/:id', function(req, res) {
        TimeTableFunctions.Login(req, res, clubName.get(req.params.id));
    });*/


    app.get('/student/:id/:regno/:action', function(req, res) {
        if (req.params.action == 'refresh') {
            if (cache.get(req.params.regno)) {
                Temp.findOne({
                    'regno': req.params.regno
                }, function(err, stud) {
                    if (err) throw err;
                    if (!stud) {
                        req.flash('ErrorMsg', 'Session Expired! Try again!');
                        res.redirect('/student/' + req.params.id);
                    } else if (stud.club_id == req.params.id) {
                        student.findOne({
                            'regno': req.params.regno,
                            'clubID': req.params.id
                        }, function(err, data) {
                            if (err) throw err;
                            if (data) {
                                res.render('refresh.ejs', {
                                    name: stud.name,
                                    registerNo: stud.regno,
                                    data: data.freeslots
                                });
                            } else {
                                res.render('refresh.ejs', {
                                    name: stud.name,
                                    registerNo: stud.regno,
                                    data: null
                                });
                            }
                        });

                    }
                });
            } else {
                req.flash('ErrorMsg', 'Some error occurred. Please try again!');
                res.redirect('/student/' + req.params.id);
            }
        } else {
            req.flash('ErrorMsg', 'Some error occurred. Please try again!');
            res.redirect('/student/' + req.params.id);
        }
    });

    app.post('/student/:id/:regno/:action', function(req, res) {
        if (req.params.action == 'refresh') {
            if (cache.get(req.params.regno)) {
                Temp.findOne({
                    'regno': req.params.regno
                }, function(err, student) {
                    if (err) throw err;
                    if (!student) {
                        req.flash('ErrorMsg', 'Session Expired! Try again!');
                        res.redirect('/student/' + req.params.id);
                    } else if (student.club_id == req.params.id) {
                        TimeTableFunctions.GetData(req, res, student);
                    }
                });
            } else {
                req.flash('ErrorMsg', 'Session Expired! Try again!');
                res.redirect('/student/' + req.params.id);
            }
        }
    });


    app.get('/check/:club', function(req, res) {
        Club.findOne({
            'loginID': req.params.club
        }, function(err, club) {
            if (err) throw err;
            if (!club) {
                res.send('No Club/chapter found');
            } else {
                student.find({
                    'clubID': req.params.club
                }, function(err, data) {
                    if (err) throw err;
                    var info = '';
                    for (i = 0; i < data.length; i++) {
                        if (data[i].email) {
                            info += '<p style="color:green;">' + data[i].regno + ' ' + data[i].name + ' - Email Updated</p>';
                        } else {
                            info += '<p style="color:red;">' + data[i].regno + ' ' + data[i].name + ' - Email Not Updated</p>';
                        }
                    }
                    res.send(info);
                });
            }
        })

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

function isSuperLoggedIn(req, res, next) {
    if (req.session.role == 'superadmin')
        return next();
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

var deleteDoc = function(regno, id) {
    student.find({
        'regno': regno,
        'clubID': id
    }).remove().exec();
    console.log('Data Deleted!');
}

function verifyRecaptcha(key, callback) {
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function(chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
}

var AllSlots = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60"];
