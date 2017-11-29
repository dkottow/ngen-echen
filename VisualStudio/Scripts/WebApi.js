'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {

    window.doCustomInit = function () {
        startWebApi();
    }
});

function startWebApi() {
    Config.get(function (cfg) {
        start(cfg);
    });

}

/**** DONKEYLIFT  ****/

function start(cfg) {
    $('input[name="account"]').val(cfg.account);
    $('input[name="database"]').val(cfg.database);

    $('body').css('overflow', 'auto'); //required due to SP

    $('#aspnetForm').css('position', 'fixed').css('top', 0);
    $('#s4-workspace').hide();
    $('.swagger-section').css('margin-top', '100px'); // beneath the O365 ribbon 
}


