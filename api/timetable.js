'use strict';

const cache = require('memory-cache');
const cheerio = require('cheerio');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const path = require('path');
const unirest = require('unirest');

const status = require(path.join(__dirname,'status'));

const day = require(path.join(__dirname, 'day'));
const config = require('../config/config.js');

exports.scrapeTimetable = function (data, callback) {
  let timetableUri = 'https://vtop.vit.ac.in/parent/timetable.asp?sem=' + config.SemesterCode;
  const CookieJar = unirest.jar();
  const cookieSerial = cache.get(data.reg_no).cookie;
  const onRequest = function (response) {
    if (response.error) {
      data.status = status.vitDown;
      callback(true, data);
    }
    else {
      const timetable = {
        courses: [],
        timings: []
      };
      try {
        const baseScraper = cheerio.load(response.body);

        let timetableScraper;
        let coursesScraper;

        if (baseScraper('b').eq(1).text().substring(0, 2) === 'No') {
          coursesScraper = null;
          timetableScraper = null;
        }
        else if (baseScraper('table table').length == 3) {
          coursesScraper = cheerio.load(baseScraper('table table').eq(0).html());
          timetableScraper = cheerio.load(baseScraper('table table').eq(2).html());
        }
        else if (baseScraper('table table').length == 2) {
          coursesScraper = cheerio.load(baseScraper('table table').eq(0).html());
          timetableScraper = cheerio.load(baseScraper('table table').eq(1).html());
        }

        const tmp = {};
        const slotTimings = {
          theory: {},
          lab: {}
        };

        if (coursesScraper) {
          const length = coursesScraper('tr').length;

          let courseCode = null;

          const onEachCourse = function (i, elem) {
            if (i > 0 && i < (length - 1)) {
              const htmlColumn = cheerio.load(coursesScraper(this).html())('td');
              const columns = htmlColumn.length;

              let tmpCode;

              let classNumber = null;
              let courseType = null;
              let ltpc = null;
              let ltpjc = null;
              let courseMode = null;
              let slot = null;
                if (columns === 13) {
                  courseCode = htmlColumn.eq(1).text();

                  classNumber = parseInt(htmlColumn.eq(3).text());
                  courseType = htmlColumn.eq(4).text();
                  ltpjc = htmlColumn.eq(5).text().replace(/[^a-zA-Z0-9]/g, '');
                  courseMode = htmlColumn.eq(6).text();
                  slot = htmlColumn.eq(8).text();
                  ltpc = ltpjc.slice(0, 3) + ltpjc.slice(4);
                  if (slot === 'NIL') slot = null;
                }
                else if (columns === 8) {
                  classNumber = parseInt(htmlColumn.eq(0).text());
                  courseType = htmlColumn.eq(1).text();
                  ltpjc = htmlColumn.eq(2).text().replace(/[^a-zA-Z0-9]/g, '');
                  courseMode = htmlColumn.eq(3).text();
                  slot = htmlColumn.eq(5).text();
                  ltpc = ltpjc.slice(0, 3) + ltpjc.slice(4);
                  if (slot === 'NIL') slot = null;
                }
                else if (columns === 12) {
                  courseCode = htmlColumn.eq(1).text();
                  classNumber = parseInt(htmlColumn.eq(3).text());
                  courseType = htmlColumn.eq(4).text();
                  ltpjc = htmlColumn.eq(5).text().replace(/[^a-zA-Z0-9]/g, '');
                  courseMode = htmlColumn.eq(6).text();
                  ltpc = ltpjc.slice(0, 3) + ltpjc.slice(4);
                }
              tmpCode = courseCode;
              if (courseType === 'Embedded Theory') {
                tmpCode = tmpCode + 'ETH';
              }
              else if (courseType === 'Embedded Lab') {
                tmpCode = tmpCode + 'ELA';
              }
              else if (courseType === 'Soft Skill') {
                tmpCode = tmpCode + 'SS';
              }
              else if (courseType === 'Theory Only') {
                tmpCode = tmpCode + 'TH';
              }
              else if (courseType === 'Lab Only') {
                tmpCode = tmpCode + 'LO';
              }
              tmp[tmpCode] = classNumber;
              timetable['courses'].push({
                class_number: classNumber,
                course_code: courseCode,
                subject_type: courseType,
                course_mode: courseMode,
                ltpc: ltpc,
                ltpjc: ltpjc,
                slot: slot
              });
            }
          };
          coursesScraper('tr').each(onEachCourse);
        }



        if (timetableScraper) {
          let timingsPerDay;
          const onEachRow = function (i, elem) {
            const htmlRow = cheerio.load(timetableScraper(this).html());
            const htmlColumn = htmlRow('td');
            const CellOneWords = htmlColumn.eq(0).text().split(' ');
            let jump, diff;
            if (CellOneWords[CellOneWords.length - 1] === 'HOURS') {
              diff = 0;
              for (let elt = 1; elt < htmlColumn.length; elt++) {
                const col = elt + diff;
                timingsPerDay = col;
                if (htmlColumn.eq(elt).attr('bgcolor') === '#C0C0C0' || htmlColumn.eq(elt).attr('bgcolor') === '#999966') {
                  diff = diff - 1;
                }
                else {
                  momentTimezone.tz.setDefault("Asia/Kolkata");
                  const text = htmlColumn.eq(elt).text();
                  const times = text.split('to');
                  const startTime = moment(times[0], 'hh:mm A').isValid() ? momentTimezone.tz(times[0], 'hh:mm A', "Asia/Kolkata").utc().format('HH:mm:ss') + 'Z' : null;
                  const endTime = moment(times[1], 'hh:mm A').isValid() ? momentTimezone.tz(times[1], 'hh:mm A', "Asia/Kolkata").utc().format('HH:mm:ss') + 'Z' : null;
                  const slotType = i === 0 ? 'theory' : 'lab';
                  slotTimings[slotType][col] = {
                    start_time: startTime,
                    end_time: endTime
                  };
                }
              }
            }
            else {
              if (timingsPerDay === htmlColumn.length - 1 || timingsPerDay === htmlColumn.length) {
                jump = 1;
                diff = 0;
              }
              else {
                jump = 2;
                diff = 1;
              }
              let last = null;
              for (let elt = 1; elt < htmlColumn.length; ++elt) {
                const text = htmlColumn.eq(elt).text().split(' ');
                const sub = text[0] + text[2];
                if (tmp[sub]) {
                  const slotType = (text[2] === 'TH' || text[2] === 'ETH' || text[2] === 'SS') ? 'theory' : 'lab';
                  const startTime = slotTimings[slotType][elt * jump - diff] ? (slotTimings[slotType][elt * jump - diff].start_time) : (slotTimings['theory'][elt * jump - diff].start_time || slotTimings['lab'][elt * jump - diff].start_time);
                  let endTime;
                  if (day.getCodeFromText(CellOneWords[0]) === 4 && htmlColumn.length === timingsPerDay && elt === 9) {
                    endTime = slotTimings[slotType][elt * jump + 1] ? slotTimings[slotType][elt * jump + 1].end_time : (slotTimings['theory'][elt * jump + 1].end_time || slotTimings['lab'][elt * jump + 1].end_time);
                  }
                  else {
                    endTime = slotTimings[slotType][elt * jump] ? slotTimings[slotType][elt * jump].end_time : (slotTimings['theory'][elt * jump].end_time || slotTimings['lab'][elt * jump].end_time);
                  }
                  if (last) {
                    if (last.class_number === tmp[sub] && last.day === day.getCodeFromText(CellOneWords[0]) && slotType === 'lab') {
                      last.end_time = endTime;
                      if (elt === htmlColumn.length - 1) {
                        timetable.timings.push(last);
                        last = null;
                      }
                    }
                    else {
                      timetable.timings.push(last);
                      last = {
                        class_number: tmp[sub],
                        day: day.getCodeFromText(CellOneWords[0]),
                        start_time: startTime,
                        end_time: endTime
                      };
                    }
                  }
                  else {
                    last = {
                      class_number: tmp[sub],
                      day: day.getCodeFromText(CellOneWords[0]),
                      start_time: startTime,
                      end_time: endTime
                    };
                  }
                }
                else {
                  if (last) {
                    timetable.timings.push(last);
                    last = null;
                  }
                }
              }
            }
          };
          timetableScraper('tr').each(onEachRow);
        }

        timetable.status = status.success;
        callback(null, timetable);
      }
      catch (ex) {
        data.status = status.dataParsing;
        callback(true, data);
      }
    }
  };
  CookieJar.add(unirest.cookie(cookieSerial), timetableUri);
  unirest.post(timetableUri)
    .jar(CookieJar)
    .timeout(28000)
    .end(onRequest);
};
