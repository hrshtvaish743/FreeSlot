// app/routes.js
var student = require('../models/student');
var Club = require('../models/club');
var curl = require('curlrequest')
var https = require('https');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var superUser = require('../models/superuser');


var name = new Map;
var reg_no = new Map;
var id = new Map;
var clubName = new Map;
var slots = new Map;
var BusySlotsFinal = new Map;
var FreeSlots = new Map;
var SECRET = "6Lfq6ygTAAAAAJm0vH_CO6gTshtKQNQ0jZLDwjNK";

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
                return next();
                // do registration using params in req.body
            } else {
                res.render('signup.ejs', {
                    message: 'Please Fill Captcha!'
                });
                //  take them back to the previous page
                // and for the love of everyone, restore their inputs
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
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({
                    'local.email': req.body.email,
                    'local.loginID': req.body.loginID
                }, function(err, user) {
                    if (!user) {
                        req.flash('forgotMessage', 'No account with that email address or LoginID Found.');
                        return res.redirect('/admin/forgot-password');
                    }
                    user.local.resetPasswordToken = token;
                    user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'freeslotvit@gmail.com', // Your email id
                        pass: 'FreeSlot1!' // Your password
                    }
                });
                var mailOptions = {
                    to: user.local.email,
                    from: 'FreeSlot',
                    subject: 'Request for Password Reset',
                    text: 'You are receiving this mail because you (or someone else) have requested to reset password for your FreeSlot account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'https://freeslot.herokuapp.com/reset/' + token + '\n\n' +
                        'This link is valid only for 1 hour.' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n\nThank you.\nTeam FreeSlot.'
                };
                smtpTransport.sendMail(mailOptions, function(err, info) {
                    console.log('Reset Message sent: ' + info.response);
                    req.flash('forgotMessage', 'An e-mail has been sent to ' + user.local.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err) return next(err);
            res.redirect('/admin/forgot-password');
        });
    });


    app.get('/reset/:token', function(req, res) {
        User.findOne({
            'local.resetPasswordToken': req.params.token,
            'local.resetPasswordExpires': {
                $gt: Date.now()
            }
        }, function(err, user) {
            if (!user) {
                req.flash('forgotMessage', 'Password reset token is invalid or has expired.');
                return res.redirect('/admin/forgot-password');
            }
            res.render('reset.ejs', {
                message: "",
                user: req.user
            });
        });
    });

    app.post('/reset/:token', function(req, res) {
        async.waterfall([
            function(done) {
                User.findOne({
                    'local.resetPasswordToken': req.params.token,
                    'local.resetPasswordExpires': {
                        $gt: Date.now()
                    }
                }, function(err, user) {
                    if (!user) {
                        req.flash('message', 'Password reset token is invalid or has expired.');
                        return res.redirect('/admin');
                    }
                    user.local.password = user.generateHash(req.body.password);
                    user.local.resetPasswordToken = undefined;
                    user.local.resetPasswordExpires = undefined;
                    user.save(function(err) {
                        req.logIn(user, function(err) {
                            done(err, user);
                        });
                    });
                });
            },
            function(user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'freeslotvit@gmail.com', // Your email id
                        pass: 'FreeSlot1!' // Your password
                    }
                });
                var mailOptions = {
                    to: user.local.email,
                    from: 'freeslotvit@gmail.com',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                        'This is a confirmation that the password for your account ' + user.local.email + ' on FreeSlot has just been changed.\n\nThank you.\nTeam FreeSlot.'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('message', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            res.redirect('/admin');
        });
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
        } else res.redirect('/admin/home');
    });

    app.post('/admin/:action', isLoggedIn, function(req, res) {
        if (req.params.action == 'profile') {
            async.waterfall([
                function(done) {
                    User.findOne({
                        'local.loginID': req.session.clubID
                    }, function(err, user) {
                        if (!user) {
                            req.flash('updateProfile', 'User Not Found.');
                            return res.redirect('/admin/profile');
                        }
                        user.local.name = req.body.name;
                        user.local.email = req.body.email;
                        user.local.RepPhone = req.body.phone;
                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                req.flash('updateProfile', 'Success! Your profile has been updated.');
                                done(err, user);
                            });
                        });
                    });
                }
            ], function(err) {
                res.redirect('/admin/profile');
            });
        } else if (req.params.action == 'change-password') {
            async.waterfall([
                function(done) {
                    User.findOne({
                        'local.loginID': req.session.clubID
                    }, function(err, user) {
                        if (!user) {
                            req.flash('changePassMessage', 'User Not Found.');
                            return res.redirect('/admin/change-password');
                        }
                        if (!user.validPassword(req.body.current)) {
                            req.flash('changePassMessage', 'Wrong Password!')
                            return res.redirect('/admin/change-password');
                        } else {
                            user.local.password = user.generateHash(req.body.new);
                            user.save(function(err) {
                                req.logIn(user, function(err) {
                                    done(err, user);
                                });
                            });
                        }
                    });
                },
                function(user, done) {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'freeslotvit@gmail.com', // Your email id
                            pass: 'FreeSlot1!' // Your password
                        }
                    });
                    var mailOptions = {
                        to: user.local.email,
                        from: 'freeslotvit@gmail.com',
                        subject: 'Your password has been changed',
                        text: 'Hello,\n\n' +
                            'This is a confirmation that the password for your account ' + user.local.email + ' on FreeSlot has just been changed.\n\nThank you.\nTeam FreeSlot.'
                    };
                    smtpTransport.sendMail(mailOptions, function(err) {
                        req.flash('changePassMessage', 'Success! Your password has been changed.');
                        done(err);
                    });
                }
            ], function(err) {
                res.redirect('/admin/change-password');
            });
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
            User.findOne({
                'local.RepRegno': req.body.regno
            }, function(err, user) {
                if (err) throw err;
                if (!user) {
                    res.send('No user Found with this register number!');
                } else {
                    Club.findOne({
                        'name': user.local.club
                    }, function(err, club) {
                        if (err) throw err;
                        if (!club) {
                            res.send('No club found!');
                        } else {
                            club.verified = true;
                            club.loginID = req.body.clubID;
                            club.save(function(err) {
                                if (err) throw err;
                            });
                        }
                    });
                    user.local.verified = true;
                    user.local.loginID = req.body.clubID;
                    user.save(function(err) {
                        if (err) throw err;
                    });
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'freeslotvit@gmail.com', // Your email id
                            pass: 'FreeSlot1!' // Your password
                        }
                    });
                    var mailOptions = {
                        to: user.local.email,
                        from: 'FreeSlot',
                        subject: 'Your account has been verified and activated!',
                        text: 'Congratulations ' + user.local.name + '!!\n\nYour Club/Chapter/Team account on FreeSlot has been verified and activated.' +
                            '\n\nYou can access your admin panel at https://freeslot.herokuapp.com/admin.\nYour username is ' + req.body.clubID +
                            '\nUse the password you provided at the time of signup.' +
                            '\n\nYour club/chapter/team\'s unique timetable update link is https://freeslot.herokuapp.com/student/' + req.body.clubID +
                            '\n\nYour club/chapter/team members can update their timetable at this link.' +
                            'Remember that they should use this link only to store their timetable under your account.' +
                            '\n\nThank you.\n\nTeam FreeSlot.\n\nFor any queries you can reply to this mail.'
                    };
                    smtpTransport.sendMail(mailOptions, function(err, info) {
                        console.log('Activation Message sent: ' + info.response);
                    });
                    res.send('VERIFIED!');
                }
            });
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
                    });
                    res.send('Club and user Deleted!');
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
                            if(err) throw err;
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
        //  id = req.params.id;
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
                //clubName = name.name;
                clubName.set(req.params.id, name.name);
                res.render('form.ejs', {
                    name: name.name,
                    message: req.flash('signupMessage')
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
        if (!req.body.registerNo || !req.body.DOB || !req.body.phoneNo || clubName.get(req.params.id) == undefined) {
            res.redirect('/');
        } else {
            req.session.regno = req.body.registerNo;
            req.session.dob = req.body.DOB;
            req.session.mobile = req.body.phoneNo;
            id.set(req.body.registerNo, req.params.id);
            var options = {
                url: 'https://vitacademics-rel.herokuapp.com/api/v2/vellore/login',
                data: 'regno=' + req.body.registerNo + '&dob=' + req.body.DOB + '&mobile=' + req.body.phoneNo
            };
            curl.request(options, function(err, file) {
                if (err) {
                    throw err;
                }
                name.set(req.body.registerNo, JSON.parse(file).name);
                reg_no.set(req.body.registerNo, JSON.parse(file).reg_no)
                var status = JSON.parse(file).status.code;
                if (status !== 0) {
                    if (status === 12) {
                        res.render('form.ejs', {
                            name: clubName.get(id.get(req.body.registerNo)),
                            id: id.get(req.body.registerNo),
                            message: 'Invalid Credentials! Please Try Again!'
                        });
                    } else if (status === 11) {
                        res.render('form.ejs', {
                            name: clubName.get(id.get(req.body.registerNo)),
                            id: id.get(req.body.registerNo),
                            message: 'Session Timed Out!!'
                        });
                    } else if (status === 89) {
                        res.render('form.ejs', {
                            name: clubName.get(id.get(req.body.registerNo)),
                            id: id.get(req.body.registerNo),
                            message: 'VIT Servers are Down. Please Try After some Time!!'
                        });
                    }
                } else {
                    res.redirect('/student/' + id.get(req.body.registerNo) + '/refresh');
                }
            });
        }
    });

    app.get('/student/:id/:action', function(req, res) {
        if (req.params.action == 'refresh') {
            if (!req.session.regno || !req.session.dob || !req.session.mobile || clubName.get(id.get(req.session.regno)) == undefined) {
                res.redirect('/');
            } else {
                var regno = req.session.regno;
                res.render('update', {
                    name: name.get(regno),
                    registerNo: reg_no.get(regno)
                });
            }
        } else if (req.params.action == 'update') {
            if (req.session.regno === undefined) {
                res.redirect('/');
            } else {
                var BusySlots = new Array();
                var regno = req.session.regno;
                for (var value of slots.get(regno)) {
                    if (value !== null) {
                        split_slots(BusySlots, value);
                    }
                }
                var TempBusyslotsFinal = new Array();
                for (var value of BusySlots) {
                    if (value[0] === 'L') {
                        TempBusyslotsFinal.push(LabSlots[value]);
                    } else if (value[0] === 'T') {
                        TempBusyslotsFinal.push(Tslots[value]);
                    } else {
                        TempBusyslotsFinal.push(TheorySlots[value][0]);
                        TempBusyslotsFinal.push(TheorySlots[value][1]);
                    }
                }
                BusySlotsFinal.set(regno, TempBusyslotsFinal);
                FreeSlots.set(regno, AllSlots.filter(function(slot) {
                    return BusySlotsFinal.get(regno).indexOf(slot) < 0
                }));
                var newStud = student({
                    name: name.get(regno),
                    regno: regno,
                    freeslots: FreeSlots.get(regno),
                    clubID: id.get(regno)
                });
                student.find({
                    'regno': regno,
                    'clubID': id.get(regno)
                }, function(err, student) {
                    if (err) throw err;
                    if (Object.keys(student).length === 0) {
                        newStud.save(function(err) {
                            if (err) throw err;
                            console.log('Data created!');
                            var regno = req.session.regno;
                            var renderName = name.get(regno);
                            var renderReg = reg_no.get(regno);
                            name.delete(regno);
                            reg_no.delete(regno);
                            clubName.delete(id.get(regno));
                            slots.delete(regno);
                            FreeSlots.delete(regno);
                            id.delete(regno);
                            BusySlotsFinal.delete(regno);
                            res.render('updated.ejs', {
                                name: renderName,
                                registerNo: renderReg
                            });
                        });
                    } else {
                        deleteDoc(regno, id.get(regno));
                        newStud.save(function(err) {
                            if (err) throw err;
                            console.log('Data updated!');
                            var regno = req.session.regno;
                            var renderName = name.get(regno);
                            var renderReg = reg_no.get(regno);
                            name.delete(regno);
                            reg_no.delete(regno);
                            clubName.delete(id.get(regno));
                            slots.delete(regno);
                            FreeSlots.delete(regno);
                            id.delete(regno);
                            BusySlotsFinal.delete(regno);
                            res.render('updated.ejs', {
                                name: renderName,
                                registerNo: renderReg
                            });
                        });
                    }
                });
            }
        } else res.redirect('/');
    });

    app.post('/student/:id/:action', function(req, res) {
        if (req.params.action == 'refresh') {
            if (!req.session.regno || !req.session.dob || !req.session.mobile || clubName.get(id.get(req.session.regno)) == undefined) {
                res.redirect('/');
            } else {
                var regno = req.session.regno;
                var options = {
                    url: 'https://vitacademics-rel.herokuapp.com/api/v2/vellore/refresh',
                    data: 'regno=' + regno + '&dob=' + req.session.dob + '&mobile=' + req.session.mobile
                };
                curl.request(options, function(err, data) {
                    if (err) {
                        throw err;
                    }
                    var status = JSON.parse(data).status.code;
                    if (status !== 0) {
                        if (status === 12) {
                            res.render('form.ejs', {
                                name: clubName.get(id.get(regno)),
                                id: id.get(regno),
                                message: 'Invalid Credentials! Please Try Again!'
                            });
                        } else if (status === 11) {
                            res.render('form.ejs', {
                                name: clubName.get(id.get(regno)),
                                id: id.get(regno),
                                message: 'Session Timed Out!!'
                            });
                        } else if (status === 89) {
                            res.render('form.ejs', {
                                name: clubName.get(id.get(regno)),
                                id: id.get(regno),
                                message: 'VIT Servers are Down. Please Try After some Time!!'
                            });
                        }
                    } else {
                        var allSlots = new Array();
                        var response = JSON.parse(data);
                        for (i = 0;; i++) {
                            if (response.courses[i] !== undefined) {
                                allSlots.push(response.courses[i].slot);
                            } else {
                                slots.set(regno, allSlots);
                                break;
                            }
                        }
                        res.redirect('/student/' + id.get(regno) + '/update');
                    }
                });
            }
        }
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
