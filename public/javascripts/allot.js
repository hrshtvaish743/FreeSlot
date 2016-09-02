var list;
var slot;
var day = undefined;
var prevSlot = undefined;
var NumberofStudents = undefined;


$(document).ready(function(next){
  $.ajax({
      type: 'GET',
      contentType: 'application/json',
      url: '/get-data',
      success: function(data) {
        list = data;
        console.log("Data Received!");
      }
  });
});

function Print() {
  console.log(JSON.stringify(list));
}

function block(Boxslot) {
    if (document.getElementById(Boxslot).innerHTML != "") {
        document.getElementById(Boxslot).innerHTML = "";
        document.getElementById(Boxslot).style.backgroundColor = 'red';
    } else {
        if (document.getElementById(Boxslot).style.backgroundColor == 'red') {
            document.getElementById(Boxslot).style.backgroundColor = '#F5F5F5';
        } else {
            document.getElementById(Boxslot).style.backgroundColor = 'red';
            if (prevSlot != undefined && prevSlot != Boxslot && document.getElementById(prevSlot).style.backgroundColor == 'red') {
                document.getElementById(prevSlot).style.backgroundColor = '#F5F5F5';
            }
        }
        prevSlot = Boxslot;
    }
    slot = Boxslot;
    document.getElementById('livesearch').innerHTML = "<h3>Loading...</h3>";
    var value = parseInt(document.getElementById(Boxslot).getAttribute('value'));
    if (day != undefined) {
      var hint = '';
      for (var i = 0; i < list.length; i++) {
          var reqSlot = ParseDay(value, day);
          //console.log(reqSlot);
          if (reqSlot !== false) {
              if (list[i].freeslots.indexOf(reqSlot) !== -1) {
                  if (hint === '') {
                      hint = "<li><a onclick=\"substitute('" + list[i].name + "')\" style=\"cursor:pointer;\">" + list[i].regno + " " + list[i].name + "</a></li>";
                  } else {
                      hint = hint + "<li><a onclick=\"substitute('" + list[i].name + "')\" style=\"cursor:pointer;\">" + list[i].regno + " " + list[i].name + "</a></li>";
                  }
              }
          } else {
            hint = "wrong slot!";
          }
      }
      if (hint === '')
          document.getElementById("livesearch").innerHTML = '<h3>No Result!</h3>';
      else {
          document.getElementById("livesearch").innerHTML = hint;
      }
    } else {
        document.getElementById("livesearch").innerHTML = "Please Select a Day";
    }
}

//Function To select the week day
function SelectDay(Day) {
    day = Day;
    console.log(day);
    document.getElementById('Selected').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + day;
}

//Function to Select No of people Per Slot
function selectNumber (number) {
  NumberofStudents = document.getElementById(number).value;
  console.log(NumberofStudents);
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

//Function to check if Slot is On the Selected Day
function ParseDay(SelectedSlot, day) {
  //console.log(parseInt(SelectedSlot));
    if (SelectedSlot <= 5) {
        if (day === "Monday") {
            return SelectedSlot;
        } else if (day === "Tuesday") {
            return SelectedSlot + 6;
        } else if (day === "Wednesday") {
            return SelectedSlot + 12;
        } else if (day === "Thursday") {
            return SelectedSlot + 18;
        } else if (day === "Friday") {
            return SelectedSlot + 24;
        }
    } else if (SelectedSlot >= 31) {
        if (day === "Monday") {
            return SelectedSlot;
        } else if (day === "Tuesday") {
            return SelectedSlot + 6;
        } else if (day === "Wednesday") {
            return SelectedSlot + 12;
        } else if (day === "Thursday") {
            return SelectedSlot + 18;
        } else if (day === "Friday") {
            return SelectedSlot + 24;
        }
    } else {
        return false;
    }
}
