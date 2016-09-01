var building;
var slot;
var day = undefined;
//document.getElementById(slot).style.backgroundColor = 'red';
var prevSlot = undefined;
//Function for clearing or selecting the slot
function block(Boxslot,value) {
    if (document.getElementById(Boxslot).innerHTML != "") {
        document.getElementById(Boxslot).innerHTML = "";
        document.getElementById(Boxslot).style.backgroundColor = '#F5F5F5';
    } else {
        if (document.getElementById(Boxslot).style.backgroundColor == 'red') {
            document.getElementById(Boxslot).style.backgroundColor = '#F5F5F5';
        } else {
            document.getElementById(Boxslot).style.backgroundColor = 'red';
            if (prevSlot != undefined && prevSlot!=Boxslot && document.getElementById(prevSlot).style.backgroundColor == 'red') {
                document.getElementById(prevSlot).style.backgroundColor = '#F5F5F5';
            }
        }
        prevSlot = Boxslot;
    }
    console.log(value);
    var data = {};
    data.slot = value;
    if(day != undefined){
    data.day = day;
    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: '/searching',
      success: function(data) {
          document.getElementById("livesearch").innerHTML = JSON.stringify(data);
      }
    });}
    else {
      document.getElementById("livesearch").innerHTML = "Please Select a Day";
    }
}
function SelectDay(Day) {
  day = Day;
  console.log(day);
  document.getElementById('Selected').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + day;
}
//function for substituting the slots with names
function substitute(name) {
    if (slot.length > 0) {
        if (document.getElementById(slot).innerHTML == "") {
            old_html = document.getElementById(slot).innerHTML = name;
            document.getElementById(slot).style.backgroundColor = 'grey';
        } else {
            if (old_html != "") {
                old_html = document.getElementById(slot).innerHTML = old_html + ' & ' + name;
                old_html = "";
            } else {
                old_html = document.getElementById(slot).innerHTML = name;
            }
        }
    }
}
