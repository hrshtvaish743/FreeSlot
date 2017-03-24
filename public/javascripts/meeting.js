var list;
var SelectedSlots = [];
var Years = [];
var SelectedYear = undefined;

// AJAX query to get all Timetable data from server
$(document).ready(function(next) {
  $('#response').hide();
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: '/get-data',
        success: function(data) {
            list = data;
            list.sort(compare);
            SplitYears(list);
            console.log("Data Received!");
        }
    });
});

function SplitYears(list) {
    Years["All"] = [];
    for (var i = 0; i < list.length; i++) {
        if (!Years[list[i].regno.slice(0, 2)]) {
            var year = list[i].regno.slice(0, 2);
            Years[year] = [];
            Years[year].push(list[i]);
            $('#SelectYear').append("<option value=\"" + year + "\" id=\"year_" + year + "\">" + year + "XXXXXX</option>");
        } else {
            var year = list[i].regno.slice(0, 2);
            Years[year].push(list[i]);
        }
        Years["All"].push(list[i]);
    }
    $('#SelectYear').append("<option value=\"All\" id=\"year_all\">All</option>");
}

function compare(a, b) {
    if (a.regno > b.regno)
        return -1;
    if (a.regno < b.regno)
        return 1;
    return 0;
}

function selectYear() {
    var selected = document.getElementById('SelectYear');
    SelectedYear = selected.options[selected.selectedIndex].value;
}

data = {};

function CallMeeting() {
  var list = Years[SelectedYear];
  var count = 0,
      total = 0,
      listLength = list.length,
      RequestCount = 0;
  data.name = $('#name').val();
  data.venue = $('#venue').val();
  data.time = $('#time').val();
  data.date = $('#date').val();
  data.message = $('#message').val();
  data.to = '';
  $('#response').show().html("");
  for(i = 0; i<listLength; i++) {
    if(list[i].email){
      if(data.to == ''){
        data.to += list[i].email;
      } else {
          data.to += ',' + list[i].email;
      }
      count++;
      total++;
    }
    if(count == 20 || i == listLength - 1) {
        i++;
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: '/admin/mail-meeting',
            data: JSON.stringify(data),
            success: function(resp) {
                if(resp.status != 1) {
                  var content = '<h4 style="color:red;">Mail Status for : ' + resp.message + ' Please try again later!'
                   '<br></h4>';
                } else {
                  var content = '<h4>Mail Status : ' + resp.message + '<br></h4>';
                  $(':input','#MeetingForm').not(':button, :submit, :reset, :hidden').val('').removeAttr('checked').removeAttr('selected');
                }
                $('#response').append(content);
            }
        });
        count = 0;
        data.to = '';
    }
  }
  return false;
}

function SendAgain(regno) {
    data.regno = regno;
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: '/admin/send-message',
        data: JSON.stringify(data),
        success: function(resp) {
            if(resp.status != 1) {
              $('#' + regno).html('Not Sent! Send again');
              console.log('Not sent to ' + regno);
            } else {
              $('#' + regno).html('Mail Sent!');
              $('#' + regno).removeAttr('onclick');
              console.log('Mail sent to ' + regno);
            }

        }
    });
  return false;
}
