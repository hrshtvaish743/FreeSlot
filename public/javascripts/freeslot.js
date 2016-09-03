var slot;
var day = undefined;
var prevSlot = undefined;
var ck_email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
var ck_regno = /^1[123456][bmBM][abceimnpsvABCEIMNPSV][abcdefihlmtsABCDEFIHLMTS]\d{4}$/;

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

$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});
