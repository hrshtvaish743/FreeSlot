var config = require('./config');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');

module.exports = {

  ForgotPasswordTokenRequest : function (req, res) {
    this.TestFunct();
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
                    user: config.email, // Your email id
                    pass: config.password // Your password
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

  ForgotPasswordTokenVerification : function(req, res) {
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


  ForgotPasswordReset : function(req, res) {
    if(!req.body.password) {
      res.render('admin.ejs', {
        message : 'Please Provide new password.'
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
                    user: config.email, // Your email id
                    pass: config.password // Your password
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
  }

}
