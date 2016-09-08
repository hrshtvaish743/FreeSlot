// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../models/user');
var Club            = require('../models/club');
var superUser       = require('../models/superUser');

var nodemailer = require('nodemailer');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // find a user whose RepRegno is the same as the forms
        // we are checking to see if the user trying to login already exists
        User.findOne({$or:[{ 'local.RepRegno' :  req.param('RepRegno')},{ 'local.email' : email },{'local.club' : req.param('club')}]}, function(err, user) {
            // if there are any errors, return the error
            if (err) {
                return done(err);
              }

            // check to see if theres already a user with that RepRegno
            if (user) {
                if(user.local.verified === true)
                    return done(null, false, req.flash('signupMessage', 'This Club/Chapter is already registered and verified OR You are already a representative of another Club/Chapter!'));
            } else {

                // if there is no user with that RepRegno
                // create the user
                var newUser            = new User();
                var newClub            = new Club();

                // set the user's local credentials
                newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
                newUser.local.email    = email;
                newUser.local.club     = req.param('club');
                newUser.local.name     = req.param('name');
                newUser.local.RepPhone = req.param('phone');
                newUser.local.RepRegno = req.param('RepRegno');
                newUser.local.loginID  = "undefined";
                newUser.local.verified = false;

                newClub.name = req.param('club');
                newClub.loginID = "undefined";
                newClub.verified = false;

                // save the user
                newClub.save(function(err) {
                    if (err)
                        throw err;
                });
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
                var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'freeslotvit@gmail.com', // Your email id
                            pass: 'FreeSlot1!' // Your password
                        }
                    });
                    var text = "Congratulations " + req.param('name') + "!!\n\t\t\tYour Club/Chapter " + req.param('club') + " is successfully registered on FreeSlot.\n\n\n"
                    +"You can still not access your account unless it's verified by us."+
                    "\n\nTo verify please reply to this mail with your contact Details(Phone Number).\n "
                    +"After verification you will be provided with an unique ID which can further be used to"
                    +" update Timetable for your Club/Chapter and also to log into your Admin Acount.\n\nThank You.\nTeam FreeSlot";
                    var mailOptions = {
                        from: 'The FreeSlot Team', // sender address
                        to: email, // list of receivers
                        subject: 'Welcome To FreeSlot!', // Subject line
                        text: text //, // plaintext body
                        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            throw err;
                        }else{
                            console.log('Message sent to user: ' + info.response);
                        };
                    });
                    text = req.param('club') + " was just registered on FreeSlot by " + req.param('name') + " " + req.param('RepRegno') + " using " + email;
                    var mailOptions = {
                        from: 'The FreeSlot App', // sender address
                        to: 'freeslotvit@gmail.com', // list of receivers
                        subject: 'New Registration!', // Subject line
                        text: text //, // plaintext body
                        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            throw err;
                        }else{
                            console.log('Message sent to admin: ' + info.response);
                        };
                    });
            }
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.loginID' :  req.param('loginID'), 'local.email': email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user){
                return done(null, false, req.flash('loginMessage', 'No user found!! Check your LoginID or Email address.')); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            if (!user.validPassword(password)){
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            }
            if (user.local.verified === false)
                return done(null, false, req.flash('loginMessage', 'Your account is not yet verified!! Please contact moderator.'))
            // all is well, return successful user
            return done(null, user);
        });

    }));

    passport.use('super-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
      User.findOne({ 'local.loginID' :  req.param('loginID'), 'local.email': email, 'local.superadmin': true }, function(err, user) {
          // if there are any errors, return the error before anything else
          if (err)
              return done(err);

          // if no user is found, return the message
          if (!user){
              return done(null, false, req.flash('superMessage', 'No user found!! Check your LoginID or Email address.')); // req.flash is the way to set flashdata using connect-flash
          }

          // if the user is found but the password is wrong
          if (!user.validPassword(password)){
              return done(null, false, req.flash('superMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
          }
          req.session.name = 'SuperUser';
          // all is well, return successful user
          return done(null, user);
      });
    }));

};
