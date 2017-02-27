'use strict';

const getCodeFromText = function (text) {
  let code;
  text = text.toUpperCase();
  switch (text) {
    case 'MON':
      code = 0;
      break;
    case 'TUE':
      code = 1;
      break;
    case 'WED':
      code = 2;
      break;
    case 'THU':
      code = 3;
      break;
    case 'FRI':
      code = 4;
      break;
    case 'SAT':
      code = 5;
      break;
    default:
      code = -1;
      break;
  }
  return code;
};

module.exports.getCodeFromText = getCodeFromText;
