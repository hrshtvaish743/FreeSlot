var config = require('../config/config');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var student = require('../models/student');
var Club = require('../models/club');
var curl = require('curlrequest');
var superUser = require('../models/superuser');
var config = require('../config/config');
var https = require('https');

var SECRET = process.env.FREESLOT_GOOGLE_SECRET;

module.exports = {

    ForgotPasswordTokenRequest: function(req, res) {
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
                        user: config.email,
                        pass: config.password
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
    },

    ForgotPasswordTokenVerification: function(req, res) {
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
    },


    ForgotPasswordReset: function(req, res) {
        if (!req.body.password) {
            res.render('admin.ejs', {
                message: 'Please Provide new password.'
            });
        }
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
                        user: config.email,
                        pass: config.password
                    }
                });
                var mailOptions = {
                    to: user.local.email,
                    from: 'FreeSlot',
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
    },

    UpdateProfile: function(req, res) {
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
    },

    ChangePassword: function(req, res) {
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
                        user: config.email, // Your email id
                        pass: config.password // Your password
                    }
                });
                var mailOptions = {
                    to: user.local.email,
                    from: config.email,
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
    },

    VerifyAccount: function(req, res) {
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
                        user.local.verified = true;
                        user.local.loginID = req.body.clubID;
                        var smtpTransport = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                user: config.email, // Your email id
                                pass: config.password // Your password
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
                            user.save(function(err) {
                                if (err) throw err;
                                club.save(function(err) {
                                    if (err) throw err;
                                });
                            });
                            res.send('VERIFIED!');
                        });
                    }
                });
            }
        });
    }
}
