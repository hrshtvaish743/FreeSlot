// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../models/user');
var Club            = require('../models/club');

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

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        Club.findOne({ 'loginID' :  req.param('loginID') }, function(err, club) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (club) {
                if(club.verified === true)
                    return done(null, false, req.flash('signupMessage', 'This Club/Chapter is already Registered and Verified.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();
                var newClub            = new Club();

                // set the user's local credentials
                newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
                newUser.local.email    = email;
                newUser.local.club     = req.param('club');
                newUser.local.name     = req.param('name');
                newUser.local.loginID  = req.param('loginID');
                newUser.local.verified = false;

                newClub.name = req.param('club');
                newClub.loginID = req.param('loginID');
                newClub.verified = false;

                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
                newClub.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newClub);
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
        User.findOne({ 'local.loginID' :  req.param('loginID') }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user){
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            if (!user.validPassword(password)){
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            }
            if (user.local.verified === false)
                return done(null, false, req.flash('loginMessage', 'Your Account is not yet Verified!! Please Contact Moderator.'))

            // all is well, return successful user
            return done(null, user);
        });

    }));

};
