var slot;
var day = undefined;
var prevSlot = undefined;
var ck_email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
var ck_regno = /^1[123456][a-zA-Z]{3}\d{4}$/;
var ck_phone = /^\d{10}$/;
var ck_password = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
var ck_dob = /^\d{8}$/;

//Function for a delete request to the Server
function deleteData(id) {
    var confirmDelete = confirm("Are You Sure You Want to Delete Timetable Data For this Student?");
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

function AddPhone(id) {
        var data = {};
        data.regno = id;
        data.phone = $('#' + id).val();
        console.log(data);
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/admin/add-phone',
            success: function(data) {
              $('#' + id).parent().html(data);
            }
        });
}



//Function to check validity
function check() {
    if (!document.getElementById('regno').value.match(ck_regno)) {
        $('#regno').css('border-color', 'red');
        return false;
    } else if (!document.getElementById('dob').value.match(ck_dob)) {
        $('#dob').css('border-color', 'red');
        return false;
    } else if (!document.getElementById('phno').value.match(ck_phone)) {
        $('#phno').css('border-color', 'red');
        return false;
    }
    return true;
}


$(document).ready(function() {
    $.validator.addMethod(
        "regex",
        function(value, element, regexp) {
            var re = new RegExp(regexp);
            return this.optional(element) || re.test(value);
        }, "Your password must be at least 8 characters long containing atleast one letter and a number"
    );
    $('#signupForm').validate({
        rules: {
            club: {
                required: true
            },
            name: {
                required: true
            },
            password: {
                required: true,
                minlength: 8,
                regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
            },
            confirmPassword: {
                required: true,
                minlength: 8,
                equalTo: "#password"
            },
            email: {
                required: true,
                email: true

            },
            RepRegno: {
                required: true,
                regex: /^1[123456][bmBM][abceimnpsvABCEIMNPSV][abcdefihlmtsABCDEFIHLMTS]\d{4}$/
            },
            phone: {
                required: true,
                regex: /^\d{10}$/
            }
        },
        messages: {
            name: "Please enter your name",
            club: "Please enter your Club's name",
            password: {
                required: "Please provide a password",
                minlength: "Your password must be at least 8 characters long containing atleast one letter and a number"
            },
            email: "Please Enter correct email address",
            confirmPassword: "Your passwords doesn't match",
            RepRegno: "Please enter correct register number",
            phone: "Please enter correct phone number of length 10"
        },
        submitHandler: function(form) {
            form.submit();
        }
    });

    $('#changepassForm').validate({
        rules: {
            current: {
                required: true
            },
            new: {
                required: true,
                minlength: 8,
                regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
            },
            confirm: {
                required: true,
                minlength: 8,
                equalTo: "#new"
            }
        },
        messages: {
            new: {
                required: "Please provide a password",
                minlength: "Your password must be at least 8 characters long containing atleast one letter and a number"
            },
            confirm: "Your passwords doesn't match"
        },
        submitHandler: function(form) {
            form.submit();
        }
    });

    $('#updateProfile').validate({
        rules: {
            name: {
                required: true
            },
            email: {
                required: true,
                email: true

            },
            phone: {
                required: true,
                regex: /^\d{10}$/
            }
        },
        messages: {
            name: "Please enter your name",
            email: "Please Enter correct email address",
            phone: "Please enter correct phone number of length 10"
        },
        submitHandler: function(form) {
            form.submit();
        }
    });

}); // end document.ready
