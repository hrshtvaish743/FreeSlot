var list;
var slot;
var day = undefined;
var prevSlot = undefined;
var NumberofStudents = undefined;
var alloted = new Map;

// AJAX query to get all Timetable data from server
$(document).ready(function(next) {
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

//Functin To Find Free People in the selected Slot
function FindFree(Boxslot) {
    document.getElementById('selectedSlot').innerHTML = 'Selected Slot : ' + Boxslot;
    slot = Boxslot;
    if (alloted.get(Boxslot) == undefined) {
        alloted.set(Boxslot, NumberofStudents);
    }
    if(document.getElementById(Boxslot).innerHTML == "") {
        document.getElementById(Boxslot).style.backgroundColor = 'red';
        console.log("changed to red of boxslot "+Boxslot);
    } else if (document.getElementById(Boxslot).innerHTML != "") {
        document.getElementById(Boxslot).style.backgroundColor = 'red';
        document.getElementById(Boxslot).innerHTML = "";
        alloted.set(Boxslot,NumberofStudents);
        console.log("changed to red and data cleared");
    }
    if(prevSlot && prevSlot != Boxslot && document.getElementById(prevSlot).innerHTML == "") {
      document.getElementById(prevSlot).style.backgroundColor = '#F5F5F5';
      console.log("changed to normal by prevSlot "+prevSlot);
    }
    prevSlot = Boxslot;
    document.getElementById('livesearch').innerHTML = "<h3>Loading...</h3>";
    var value = parseInt(document.getElementById(Boxslot).getAttribute('value'));
    if (day != undefined) {
        var hint = '';
        for (var i = 0; i < list.length; i++) {
            var reqSlot = ParseDay(value, day);
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

//Function to clear all the slots
function ClearAll() {
  for (var i = 1; i < 60; i++) {
    if(document.getElementById(i) && i != slot) {
    document.getElementById(i).innerHTML = "";
    document.getElementById(i).style.backgroundColor = '#F5F5F5';
  } else if (i == slot) {
    document.getElementById(i).innerHTML = "";
    document.getElementById(i).style.backgroundColor = 'red';
    alloted.set(slot,NumberofStudents);
  }
  }
}

//Function To select the week day
function SelectDay(Day) {
    day = Day;
    ClearAll();
    document.getElementById('Selected').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + day;
}

//Function to Select No of people Per Slot
function selectNumber(number) {
    NumberofStudents = document.getElementById(number).value;
}

//function for substituting the slots with names
function substitute(name) {
    if (slot.length > 0) {
        if (alloted.get(slot) == NumberofStudents && document.getElementById(slot).innerHTML == "") {
            old_html = document.getElementById(slot).innerHTML = name;
            document.getElementById(slot).style.backgroundColor = 'grey';
            var current = alloted.get(slot) - 1;
            alloted.set(slot, current);
            console.log("name added and color changed to grey");
        } else {
            if (alloted.get(slot) < NumberofStudents && alloted.get(slot) > 0) {
                old_html = document.getElementById(slot).innerHTML = old_html + ' - ' + name;
                var current = alloted.get(slot) - 1;
                alloted.set(slot, current);
                console.log('name added 1 ');
            } else if (alloted.get(slot) == 1) {
                old_html = document.getElementById(slot).innerHTML = old_html + ' - ' + name;
                var current = alloted.get(slot) - 1;
                alloted.set(slot, current);
                old_html = "";
                console.log('name added 2');
            } else {
                old_html = document.getElementById(slot).innerHTML = name;
                var current = NumberofStudents - 1;
                document.getElementById(slot).style.backgroundColor = 'grey';
                alloted.set(slot, current);
                console.log('data cleared name added');
            }
        }
    }
}

//Function to check if Slot is On the Selected Day
function ParseDay(SelectedSlot, day) {
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
