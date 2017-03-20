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

function CallMeeting() {
  var list = Years[SelectedYear];
  data = {};
  data.name = $('#name').val();
  data.venue = $('#venue').val();
  data.time = $('#time').val();
  data.date = $('#date').val();
  data.message = $('#message').val();
  $('#response').show();
  for(i = 0; i<list.length; i++) {
    data.regno = list[i].regno;
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: '/admin/mail-meeting',
        data: JSON.stringify(data),
        success: function(resp) {
            if(resp.status != 1) {
              var content = '<h4 style="color:red;">Mail Status for ' + resp.name + ' : ' + resp.message + '<br></h4>';
            } else {
              var content = '<h4>Mail Status for ' + resp.name + ' : ' + resp.message + '<br></h4>';
            }

            $('#response').append(content);
        }
    });
  }
  $(':input','#MeetingForm').not(':button, :submit, :reset, :hidden').val('').removeAttr('checked').removeAttr('selected');
  return false;
}
