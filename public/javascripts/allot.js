    var list;
    var slot;
    var day = undefined;
    var prevSlot = undefined;
    var NumberofStudents = 1;
    var SelectedYear = undefined;
    var allotedSlot = new Map;
    var FreeUnion = {};
    var Years = [];

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



    //Functin To Find Free People in the selected Slot
    function FindFree(Boxslot) {
        Free = {};
        slot = Boxslot;
        if (allotedSlot.get(Boxslot) == undefined) {
            allotedSlot.set(Boxslot, NumberofStudents);
        }
        if ($('#' + Boxslot).html() == "") {
            $('#' + Boxslot).css('background-color', 'red');
        } else if ($('#' + Boxslot).html() != "") {
            $('#' + Boxslot).css('background-color', 'red');
            $('#' + Boxslot).html('');
            allotedSlot.set(Boxslot, NumberofStudents);
        }
        if (prevSlot && prevSlot != Boxslot && $('#' + prevSlot).html() == "") {
            $('#' + prevSlot).css('background-color', '#F5F5F5');
        }
        prevSlot = Boxslot;
        var value = parseInt($('#' + Boxslot).attr('value'));
        if (day && SelectedYear) {
            for (var i = 0; i < Years[SelectedYear].length; i++) {
                var reqSlot = ParseDay(value, day);
                $('#selectedSlot').html('Selected Slot : L' + reqSlot);
                if (reqSlot !== false) {
                    if (Years[SelectedYear][i].freeslots.indexOf(reqSlot) !== -1) {
                        regno = Years[SelectedYear][i].regno;
                        Free[regno] = Years[SelectedYear][i].name;
                    }
                } else {
                    $('#TableBody').html('<h3>WRONG SLOT</h3>');
                }
            }
            if (jQuery.isEmptyObject(Free))
                $('#TableBody').html('<h3>No Result!</h3>');
            else {
                $('#TableBody').html('');
                var num = 1;
                $('.tableContainer').show();
                jQuery.each(Free, function(reg_no, name) {
                    $('#TableBody').append("<tr class=\"" + reg_no + "\"><td class=\"col-xs-2\">" + num + "</td><td class=\"col-xs-8\"><a id=\"" + reg_no + "\" onclick=\"substitute(this.id)\" style=\"cursor:pointer;\">" + name + "</a></td><td class=\"col-xs-2\">" + reg_no + "</td></tr>");
                    $('#copy-div').append(name + "&nbsp;" + reg_no + "<br>")
                    num++;
                });
            }
        } else {
            alert('Please select both day and year of students!')
        }

    }


    //Function To select the week day
    function selectDay() {
        var Selected = document.getElementById('SelectDay');
        day = Selected.options[Selected.selectedIndex].value;
        ClearAll();
    }

    //Function to Select No of people Per Slot
    function selectNumber() {
        var Selected = document.getElementById('SelectNumber');
        NumberofStudents = Selected.options[Selected.selectedIndex].value;
    }

    //function to select the year of students
    function selectYear() {
        var selected = document.getElementById('SelectYear');
        SelectedYear = selected.options[selected.selectedIndex].value;
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
            if ($('#' + i) && i != slot) {
                $('#' + i).html("");
                $('#' + i).css('background-color', '#F5F5F5');
            } else if (i == slot) {
              $('#' + i).html("");
              $('#' + i).css('background-color', 'red');
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
                $('.' + regno).remove();
                $('#' + slot).css('background-color', '#A9A7B0');
                var current = allotedSlot.get(slot) - 1;
                allotedSlot.set(slot, current);
            } else {
                if (allotedSlot.get(slot) < NumberofStudents && allotedSlot.get(slot) > 0) {
                    old_html = document.getElementById(slot).innerHTML = old_html + ' - ' + Free[regno];
                    delete Free[regno];
                    $('.' + regno).remove();
                    var current = allotedSlot.get(slot) - 1;
                    allotedSlot.set(slot, current);
                } else if (allotedSlot.get(slot) == 1) {
                    old_html = document.getElementById(slot).innerHTML = old_html + ' - ' + Free[regno];
                    delete Free[regno];
                    $('.' + regno).remove();
                    var current = allotedSlot.get(slot) - 1;
                    allotedSlot.set(slot, current);
                    old_html = "";
                } else {
                    old_html = document.getElementById(slot).innerHTML = Free[regno];
                    delete Free[regno];
                    $('.' + regno).remove();
                    var current = NumberofStudents - 1;
                    $('#' + slot).css('background-color', '#A9A7B0');
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
            $('#' + BoxId).css('background-color', '#A9A7B0');
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
        for (var k = 0; k < Years[SelectedYear].length; k++) {
            allotedStudent.set(Years[SelectedYear][k].regno, 0);
        }
        for (var i = 1; i < DaySlot; i++) {
            slot = ParseDay(i, day);
            Free = {};
            for (var k = 0; k < Years[SelectedYear].length; k++) {
                if (Years[SelectedYear][k].freeslots.indexOf(slot) !== -1) {
                    regno = Years[SelectedYear][k].regno;
                    Free[regno] = Years[SelectedYear][k].name;
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
            for (var k = 0; k < Years[SelectedYear].length; k++) {
                if (Years[SelectedYear][k].freeslots.indexOf(slot) !== -1) {
                    regno = Years[SelectedYear][k].regno;
                    Free[regno] = Years[SelectedYear][k].name;
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


    $(document).ready(function() {
        $('.filterable .btn-filter').click(function() {
            var $panel = $(this).parents('.filterable'),
                $filters = $panel.find('.filters input'),
                $tbody = $panel.find('.table tbody');
            if ($filters.prop('disabled') == true) {
                $filters.prop('disabled', false);
                $filters.last().focus();
            } else {
                $filters.val('').prop('disabled', true);
                $tbody.find('.no-result').remove();
                $tbody.find('tr').show();
            }
        });

        $('.filterable .filters input').keyup(function(e) {
            /* Ignore tab key */
            var code = e.keyCode || e.which;
            if (code == '9') return;
            var $input = $(this),
                inputContent = $input.val().toLowerCase(),
                $panel = $input.parents('.filterable'),
                column = $panel.find('.filters th').index($input.parents('th')),
                $table = $panel.find('.table'),
                $rows = $table.find('tbody tr');
            /* Dirtiest filter function ever ;) */
            var $filteredRows = $rows.filter(function() {
                var value = $(this).find('td').eq(column).text().toLowerCase();
                return value.indexOf(inputContent) === -1;
            });
            /* Clean previous no-result if exist */
            $table.find('tbody .no-result').remove();
            /* Show all rows, hide filtered ones (never do that outside of a demo ! xD) */
            $rows.show();
            $filteredRows.hide();
            /* Prepend no-result row if all rows are filtered */
            if ($filteredRows.length === $rows.length) {
                $table.find('tbody').prepend($('<tr class="no-result text-center"><td colspan="' + $table.find('.filters th').length + '">No result found</td></tr>'));
            }
        });
    });


    var clipboard = new Clipboard('#copy-btn');
    clipboard.on('success', function(e) {
        e.clearSelection();
    });
