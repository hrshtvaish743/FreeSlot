var list;
var SelectedSlots = [];
var Years = [];
var SelectedYear;

// AJAX query to get all Timetable data from server
$(document).ready(function(next) {
  $('.tableContainer').hide();
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
    }
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

var FreeStudents;

function handleChange(checkbox) {
  FreeStudents = {};
  $('#TableBody').html("");
  if(checkbox.checked == true){
    SelectedSlots.push(checkbox.id);
    for(i = 0; i<SelectedSlots.length; i++) {
      FindFree(SelectedSlots[i]);
    }
    var num = 1;
    $('.tableContainer').show();
    jQuery.each(FreeStudents, function(reg_no, name) {
        $('#TableBody').append("<tr class=\"" + reg_no + "\"><td class=\"col-xs-2\">" + num + "</td><td class=\"col-xs-8\"><a id=\"" + reg_no + "\" onclick=\"substitute(this.id)\" style=\"cursor:pointer;\">" + name + "</a></td><td class=\"col-xs-2\">" + reg_no + "</td></tr>");
        num++;
    });
    } else {
      SelectedSlots.splice(SelectedSlots.indexOf(checkbox.id),1);
      for(i = 0; i<SelectedSlots.length; i++) {
        FindFree(SelectedSlots[i]);
      }
      var num = 1;
      $('.tableContainer').show();
      jQuery.each(FreeStudents, function(reg_no, name) {
          $('#TableBody').append("<tr class=\"" + reg_no + "\"><td class=\"col-xs-2\">" + num + "</td><td class=\"col-xs-8\"><a id=\"" + reg_no + "\" onclick=\"substitute(this.id)\" style=\"cursor:pointer;\">" + name + "</a></td><td class=\"col-xs-2\">" + reg_no + "</td></tr>");
          num++;
      });
    }
}

function FindFree(slot) {
  TempFree = {};
  for (var i = 0; i < Years[SelectedYear].length; i++) {
    if (Years[SelectedYear][i].freeslots.indexOf(parseInt(slot)) >= 0) {
      regno = Years[SelectedYear][i].regno;
      TempFree[regno] = Years[SelectedYear][i].name;
    }
  }
  if(jQuery.isEmptyObject(FreeStudents)) {
    FreeStudents = TempFree;
  } else {
    var common = {};
    jQuery.each(FreeStudents, function(regno, name) {
      jQuery.each(TempFree, function(Tregno) {
        if(Tregno == regno)
            common[regno] = name;
      });
    });
    FreeStudents = common;
  }
}
