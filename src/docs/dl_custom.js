/* global $ */
window.doCustomInit = function() {
    console.log("DL - add example values to path params.");
    $('input[name="account"]').attr('value','demo');
    $('input[name="database"]').attr('value','sandwiches');
    $('input[name="table"]').attr('value','customers');
}