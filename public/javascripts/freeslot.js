var slot;
var day = undefined;
var prevSlot = undefined;
var ck_email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
var ck_regno = /^1[123456][bmBM][abceimnpsvABCEIMNPSV][abcdefihlmtsABCDEFIHLMTS]\d{4}$/;

//Function for clearing or selecting the slot
//and sending request to the server for getting list of students who are free in that Slot
/*function block(Boxslot) {
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
    var value = document.getElementById(Boxslot).getAttribute('value');
    console.log(value);
    var data = {};
    data.slot = value;
    if (day != undefined) {
        data.day = day;
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/searching',
            success: function(data) {
                document.getElementById("livesearch").innerHTML = data;
            }
        });
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
*/

//Function for a delete request to the Server
function deleteData(id) {
    var confirmDelete = confirm("Are You Sure You Want to Delete Timetable Data For this Student?")
    if (confirmDelete == true) {
        var data = {};
        data.regno = document.getElementById(id).getAttribute('regno');
        console.log(data);
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/admin/delete',
            success: function(data) {
                document.getElementById(id).innerHTML = data;
            }
        });
    }
}

//Function to check validity
function check() {
    if(!document.getElementById('regno').value.match(ck_regno)) {
      console.log('wrong');
      return false;
    }
    return true;
}
