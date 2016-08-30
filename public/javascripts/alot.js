var building;
var slot = '1';
document.getElementById(slot).style.backgroundColor = 'red';
var prevSlot = '1';
//function for selecting the building
function selectBuilding(value) {
    building = value;
}
//Function for clearing or selecting the slot
function block(Boxslot) {
    if (document.getElementById(Boxslot).innerHTML != "") {
        document.getElementById(Boxslot).innerHTML = "";
        document.getElementById(Boxslot).style.backgroundColor = '#white';
    } else {
        slot = Boxslot;
        if (document.getElementById(Boxslot).style.backgroundColor == 'red') {
            document.getElementById(Boxslot).style.backgroundColor = '#F5F5F5';
        } else {
            document.getElementById(Boxslot).style.backgroundColor = 'red';

        }
        if (document.getElementById(prevSlot).style.backgroundColor == 'red') {
            document.getElementById(prevSlot).style.backgroundColor = '#F5F5F5';
        }
        prevSlot = Boxslot;

    }
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

//Function for Searching the Free Persons by a Post request
$(function(){
  $('#slot').on('keyup',function(e){
    e.preventDefault();
    var data = {};
    data.slot = $(this).val();
    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: '/searching',
      success: function(data) {
        for (var i = 0; i < data.length; i++){
          document.getElementById("livesearch").innerHTML = data;
        }

      }
    });
  });
});
