'use strict';

const cache = require('memory-cache');
const cheerio = require('cheerio');
const path = require('path');
const unirest = require('unirest');
const Temp = require('../models/temp.js');

const status = require(path.join(__dirname, 'status'));
const Login = require(path.join(__dirname, 'login'));



exports.get = function(data, callback) {
    if (cache.get(data.reg_no) !== null) {
        const CookieJar = unirest.jar();
        const cookieSerial = cache.get(data.reg_no).cookie;
        let submitUri = 'https://vtop.vit.ac.in/student/student_login_submit.asp';

        CookieJar.add(unirest.cookie(cookieSerial), submitUri);
        const onPost = function(response) {
            delete data['captcha'];
            if (response.error) {
                data.status = status.vitDown;
                console.log(data.status);
                callback(true, data);
            } else {
                try {
                    let $ = cheerio.load(response.body);

                    if ($('input[type="hidden"]').attr('value') == 'Enter Verification Code of 6 characters exactly as shown.') {

                        console.log('Captcha Failed');
                        data.status = status.captchaFail;
                        Login.get(data, callback);

                    } else if ($('input[type="hidden"]').attr('value') == 'Invalid Password 2 (i.e. Parent or Guardian Mobile No.)....!' || $('input[type="hidden"]').attr('value') == 'Invalid Password 1 (i.e. DOB)....!') {

                        console.log('Invalid Credentials');
                        data.status = status.invalid;
                        console.log(JSON.stringify(data));
                        callback(null, data);

                    } else {

                        let Tables = cheerio.load($('table').eq(1).html());
                        var texts = Tables('td font').eq(0).text().split(' - ');
                        var reg = texts[0].replace(/[^a-zA-Z0-9]/g, '');

                        if (reg === data.reg_no) {
                            data.name = texts[1].trim();
                            const validity = 3; // In Minutes
                            const doc = {
                                reg_no: data.reg_no,
                                password: data.password,
                                cookie: cookieSerial
                            };

                            cache.put(data.reg_no, doc, validity * 60 * 1000);
                            data.status = status.success;
                            callback(null, data);
                        } else {
                            data.status = status.invalid;
                            console.log(JSON.stringify(data));
                            callback(null, data);
                        }
                    }
                } catch (ex) {
                    console.log(ex);
                    data.status = status.dataParsing;
                    callback(null, data);
                }
            }
        };
        unirest.post(submitUri)
            .jar(CookieJar)
            .form({
                regno: data.reg_no,
                passwd: data.password,
                vrfcd: data.captcha
            })
            .timeout(28000)
            .end(onPost);
    } else {
        data.status = status.timedOut;
        callback(null, data);
    }
};
