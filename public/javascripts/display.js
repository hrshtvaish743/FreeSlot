var list;
// AJAX query to get all Timetable data from server
$(document).ready(function(next) {
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: '/get-data',
        success: function(data) {
            list = data;
            console.log("Data Received!");
            for(i = 0;;i++) {
              if(!list[i]) break;
              var html = '<li><a onclick="SelectStud(' + i + ')" style="cursor:pointer;">' + list[i].name + '</a></li>';
              $('.dropdown-menu').append(html);
        }
      }
    });
});
var j = 0;
function SelectStud(i) {
  clear();
  $('#Selected').empty().append(list[i].regno + "  " + list[i].name);
  console.log(list[i]);
  for(j = 0; j < list[i].freeslots.length; j++) {
    $('#' + list[i].freeslots[j]).css("background-color", "green").append("Class");
  }
}

function clear() {
  for(var i = 1; i<60; i++){
    $('#' + i).css("background-color", "#F5F5F5").empty();
  }
}
