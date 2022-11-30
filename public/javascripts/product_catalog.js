function otherSelect() {
    var other1 = document.getElementById("dimensionBox");
    var other2 = document.getElementById("slotBox");
    var pick = document.forms[0].category.options[document.forms[0].category.selectedIndex].value;
    if ( pick == "Folder" || pick == "Planner" ) { other1.style.visibility = "visible";}
                                        else { other1.style.visibility = "hidden";}
    if ( pick == "Pen Organizer") { other2.style.visibility = "visible";}
                                        else { other2.style.visibility = "hidden";}
}

function openTab(evt, productCategory) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(productCategory).style.display = "block";
    evt.currentTarget.className += " active";
    }