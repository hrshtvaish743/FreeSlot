'use strict';

const path = require('path');


const captchaParser = require(path.join(__dirname, 'captcha-parser'));

const Get = require(path.join(__dirname, 'get'));
const status = require(path.join(__dirname, 'status'));
const submit = require(path.join(__dirname, 'submit'));


exports.get = function (data, callback) {
  const parseCaptcha = function (err, captchaImage) {
    if (err) {
      callback(true, captchaImage);
    }
    else {
      try {
        data.captcha = captchaParser.parseBuffer(captchaImage);
      }
      catch (ex) {
        data.status = status.captchaParsing;
        callback(true, data);
      }
      submit.get(data, callback);
    }
  };
  Get.get(data, parseCaptcha);
};
