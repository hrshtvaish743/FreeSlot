'use strict';

const async = require('async');
const cache = require('memory-cache');
const path = require('path');

const config = require(path.join(__dirname, '..', 'config', 'config'));


const status = require(path.join(__dirname, 'status'));
const timetable = require(path.join(__dirname, 'timetable'));
const Scraper = require(path.join(__dirname, 'scraper'));


exports.get = function(data, callback) {

    if (cache.get(data.reg_no) !== null) {
        const cacheDoc = cache.get(data.reg_no);
        if (cacheDoc.dob === data.dob && cacheDoc.mobile === data.mobile) {
            data.semester = config.SemesterCode;
            const cookieSerial = cache.get(data.reg_no).cookie;
            const parallelTasks = {
                timetable: function(asyncCallback) {
                    timetable.scrapeTimetable(data, asyncCallback)
                }
            };
            const onFinish = function(err, results) {
                if (err || results.timetable.status.code !== 0) {
                    data.status = results.timetable.status;
                    data.HTML_error = true;
                    console.log(JSON.stringify(data));
                    callback(false, results);
                } else if (!results.timetable.courses[0]) {
                    Scraper.get(data, callback);
                } else {
                    delete results.timetable.status;
                    data.courses = results.timetable.courses;
                    const forEachCourse = function(element, asyncCallback) {
                        element.timings = [];
                        switch (element.course_mode.toUpperCase()) {
                            case 'CBL':
                                element.course_type = 1;
                                break;
                            case 'LBC':
                                element.course_type = 2;
                                break;
                            case 'PBL':
                                element.course_type = 3;
                                break;
                            case 'RBL':
                                element.course_type = 4;
                                break;
                            case 'PBC':
                                if (element.project_title) {
                                    element.course_type = 5;
                                } else {
                                    element.course_type = 6;
                                }
                                break;
                            default:
                                element.course_type = 0;
                                break;
                        }
                        const forEachTimings = function(elt, i, arr) {
                            if (element.class_number === elt.class_number) {
                                delete elt.class_number;
                                element.timings.push(elt);
                            }
                        };
                        results.timetable.timings.forEach(forEachTimings);
                        const noData = {
                            supported: false
                        };
                        element.credits = parseInt(element.ltpjc.slice(4));
                        const class_count = element.timings.length || 1;
                        const total_classes = parseInt(element.ltpjc.charAt(0)) + parseInt(element.ltpjc.charAt(1)) + parseInt(element.ltpjc.charAt(2));
                        element.class_length = total_classes / class_count;
                        if (element.course_code.indexOf('STS') > -1) {
                            element.class_length = 1;
                        }
                        asyncCallback(null, element);
                    };
                    const doneCollate = function(err, newData) {
                        if (err) {
                            callback(true, status.other);
                        } else {
                            data.courses = newData;
                            const validity = 3; // In Minutes
                            const doc = {
                                reg_no: data.reg_no,
                                dob: data.dob,
                                mobile: data.mobile,
                                cookie: cookieSerial,
                                refreshed: true
                            };
                            cache.put(data.reg_no, doc, validity * 60 * 1000);
                            data.cached = false;
                            data.status = status.success;
                            callback(null, data);
                        }
                    };
                    async.map(data.courses, forEachCourse, doneCollate);
                }
            };
            async.parallel(parallelTasks, onFinish);

        } else {
            data.status = status.invalid;
            callback(true, data);
        }
    } else {
        data.status = status.timedOut;
        callback(true, data);
    }
};
