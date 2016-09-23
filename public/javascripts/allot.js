    var list;
    var slot;
    var day = undefined;
    var prevSlot = undefined;
    var NumberofStudents = undefined;
    var allotedSlot = new Map;
    var Free = {};

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
        Free = {};
        slot = Boxslot;
        if (allotedSlot.get(Boxslot) == undefined) {
            allotedSlot.set(Boxslot, NumberofStudents);
        }
        if (document.getElementById(Boxslot).innerHTML == "") {
            document.getElementById(Boxslot).style.backgroundColor = 'red';
        } else if (document.getElementById(Boxslot).innerHTML != "") {
            document.getElementById(Boxslot).style.backgroundColor = 'red';
            document.getElementById(Boxslot).innerHTML = "";
            allotedSlot.set(Boxslot, NumberofStudents);
        }
        if (prevSlot && prevSlot != Boxslot && document.getElementById(prevSlot).innerHTML == "") {
            document.getElementById(prevSlot).style.backgroundColor = '#F5F5F5';
        }
        prevSlot = Boxslot;
        document.getElementById('livesearch').innerHTML = "<h3>Loading...</h3>";
        var value = parseInt(document.getElementById(Boxslot).getAttribute('value'));
        if (day != undefined) {
            for (var i = 0; i < list.length; i++) {
                var reqSlot = ParseDay(value, day);
                document.getElementById('selectedSlot').innerHTML = 'Selected Slot : L' + reqSlot;
                if (reqSlot !== false) {
                    if (list[i].freeslots.indexOf(reqSlot) !== -1) {
                        regno = list[i].regno;
                        Free[regno] = list[i].name;
                    }
                } else {
                    document.getElementById("livesearch").innerHTML = '<h3>WRONG SLOT</h3>';
                }
            }
            if (jQuery.isEmptyObject(Free))
                document.getElementById("livesearch").innerHTML = '<h3>No Result!</h3>';
            else {
                document.getElementById("livesearch").innerHTML = "";
                jQuery.each(Free, function(i, val) {
                    document.getElementById('livesearch').innerHTML += "<li><a id=\"" + i + "\" onclick=\"substitute(this.id)\" style=\"cursor:pointer;\">" + i + " " + val + "</a></li>";
                });
            }
        } else {
            document.getElementById("livesearch").innerHTML = "<h3>Please Select a Day</h3>";
            alert('Please select a Day!')
        }

    }


    //Function To select the week day
    function SelectDay(Day) {
        day = Day;
        ClearAll();
        document.getElementById('Selected').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + day;
        document.getElementById("livesearch").innerHTML = "";
    }

    //Function to Select No of people Per Slot
    function selectNumber(number) {
        NumberofStudents = document.getElementById(number).value;
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

    //Function to clear all the slots
    function ClearAll() {
        for (var i = 1; i < 60; i++) {
            if (document.getElementById(i) && i != slot) {
                document.getElementById(i).innerHTML = "";
                document.getElementById(i).style.backgroundColor = '#F5F5F5';
            } else if (i == slot) {
                document.getElementById(i).innerHTML = "";
                document.getElementById(i).style.backgroundColor = 'red';
                allotedSlot.set(slot, NumberofStudents);
            }
        }
    }

    //function for substituting the slots with names
    function substitute(regno) {
        if (slot) {
            if (allotedSlot.get(slot) == NumberofStudents && document.getElementById(slot).innerHTML == "") {
                old_html = document.getElementById(slot).innerHTML = Free[regno];
                delete Free[regno];
                $('#' + regno).parent().remove();
                document.getElementById(slot).style.backgroundColor = 'grey';
                var current = allotedSlot.get(slot) - 1;
                allotedSlot.set(slot, current);
            } else {
                if (allotedSlot.get(slot) < NumberofStudents && allotedSlot.get(slot) > 0) {
                    old_html = document.getElementById(slot).innerHTML = old_html + ' - ' + Free[regno];
                    delete Free[regno];
                    $('#' + regno).parent().remove();
                    var current = allotedSlot.get(slot) - 1;
                    allotedSlot.set(slot, current);
                } else if (allotedSlot.get(slot) == 1) {
                    old_html = document.getElementById(slot).innerHTML = old_html + ' - ' + Free[regno];
                    delete Free[regno];
                    $('#' + regno).parent().remove();
                    var current = allotedSlot.get(slot) - 1;
                    allotedSlot.set(slot, current);
                    old_html = "";
                } else {
                    old_html = document.getElementById(slot).innerHTML = Free[regno];
                    delete Free[regno];
                    $('#' + regno).parent().remove();
                    var current = NumberofStudents - 1;
                    document.getElementById(slot).style.backgroundColor = 'grey';
                    allotedSlot.set(slot, current);
                }
            }
        }
    }


    var random;
    var number = 2;

    function pickRandom(Free) {
        var result;
        var count = 0;
        for (var prop in Free)
            if (Math.random() < 1 / ++count)
                result = prop;
        return result;
    }
    var allotedStudent = new Map();
    var minimum = 0;


    function autoSubstitute(BoxId, Free) {
        if (allotedSlot.get(BoxId) == NumberofStudents) {
            old_html = document.getElementById(BoxId).innerHTML = Free[random];
            delete Free[random];
            document.getElementById(BoxId).style.backgroundColor = 'grey';
            var current = allotedSlot.get(BoxId) - 1;
            allotedSlot.set(BoxId, current);
            var current = allotedStudent.get(random) + 1;
            allotedStudent.set(random, current);
            count += 1;
        } else {
            if (allotedSlot.get(BoxId) < NumberofStudents && allotedSlot.get(BoxId) > 0) {
                old_html = document.getElementById(BoxId).innerHTML = old_html + ' - ' + Free[random];
                delete Free[random];
                var current = allotedSlot.get(BoxId) - 1;
                allotedSlot.set(BoxId, current);
                var current = allotedStudent.get(random) + 1;
                allotedStudent.set(random, current);
                count += 1;
            } else if (allotedSlot.get(BoxId) == 1) {
                old_html = document.getElementById(BoxId).innerHTML = old_html + ' - ' + Free[random];
                delete Free[random];
                var current = allotedSlot.get(BoxId) - 1;
                allotedSlot.set(BoxId, current);
                var current = allotedStudent.get(random) + 1;
                allotedStudent.set(random, current);
                count += 1;
                old_html = "";
            }
        }
    }

    function randomize(BoxId, Free) {
        count = 0;
        tries = 0
        while (count < NumberofStudents) {
            random = pickRandom(Free);
            if (Free[random])
                autoSubstitute(BoxId, Free);
            else
                tries += 1;
            if (tries == 3)
                count++;
        }
    }

    function autoAssign() {
        if (!NumberofStudents || !day) {
            document.getElementById("livesearch").innerHTML = "<h3>Please select both Day and Number of Students per slot";
            alert('Please select both Day and Number of Students per slot');
            return false;
        }
        if (day == 'Wednesday')
            DaySlot = 4;
        else
            DaySlot = 6;

        if (NumberofStudents > 2) {
            alert('Number of students per slot can not be more  than 2 when alloting automatically');
            NumberofStudents = 2;
        }
        allotedStudent = new Map;
        for (var k = 0; k < list.length; k++) {
            allotedStudent.set(list[k].regno, 0);
        }
        for (var i = 1; i < DaySlot; i++) {
            slot = ParseDay(i, day);
            Free = {};
            for (var k = 0; k < list.length; k++) {
                if (list[k].freeslots.indexOf(slot) !== -1) {
                    regno = list[k].regno;
                    Free[regno] = list[k].name;
                }
            }
            for (var j = i; j <= 29;) {
                allotedSlot.set(j, NumberofStudents);
                if (!jQuery.isEmptyObject(Free)) {
                    randomize(j, Free);
                }
                j = j + 6;
            }
        }
        for (var i = 31; i < 35; i++) {
            slot = ParseDay(i, day);
            Free = {};
            for (var k = 0; k < list.length; k++) {
                if (list[k].freeslots.indexOf(slot) !== -1) {
                    regno = list[k].regno;
                    Free[regno] = list[k].name;
                }
            }
            for (var j = i; j <= 59;) {
                allotedSlot.set(j, NumberofStudents);
                if (!jQuery.isEmptyObject(Free)) {
                    randomize(j, Free);
                }
                j = j + 6;
            }
        }
    }
