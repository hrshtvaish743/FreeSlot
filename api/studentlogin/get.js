'use strict';

const cache = require('memory-cache');
const path = require('path');
const unirest = require('unirest');

const status = require(path.join(__dirname, 'status'));


exports.get = function(data, callback) {
    let captchaUri = 'https://vtop.vit.ac.in/student/captcha.asp';
    const onRequest = function(response) {
        if (response.error) {
            data.status = status.vitDown;
            console.log(JSON.stringify(data));
            callback(true, data);
        } else {
            const validity = 2; // In Minutes
            const key = Object.keys(response.cookies)[0];
            const cookieSerial = key + "=" + response.cookies[key];
            const doc = {
                reg_no: data.reg_no,
                cookie: cookieSerial,
                dob: data.dob,
                mobile: data.mobile
            };
            cache.put(data.reg_no, doc, validity * 60 * 1000);
            callback(null, response.body);
        }
    };
    unirest.get(captchaUri)
        .encoding(null)
        .timeout(26000)
        .end(onRequest);
};
