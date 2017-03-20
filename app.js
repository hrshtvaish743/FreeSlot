var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var session  = require('express-session');
var configDB = require('./config/database.js');
var Temp = require('./models/temp');
var unirest = require('unirest');

mongoose.connect(configDB.url, function(err) {
    if (err) {
      console.log("Can't connect to DB!");
      throw err;
    }
    console.log('Connected to database!');
    Temp.remove({},function(err) {
      if(err) throw err;
    });
});
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';


var app = express();
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'iamharshitvaish',
  cookie: { maxAge: 60000000 },
  resave: true,
  saveUninitialized: true
  }));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./config/passport.js')(passport);
require('./routes/routes.js')(app, passport);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.jpg')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.render('error');
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err);
    res.send(err);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('Error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
