'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {
    startDataBrowser();
});

function startDataBrowser() {
    console.log('startDataBrowser');
    Config.get(function (cfg) {
        startApp(cfg);
    });
}

/**** DONKEYLIFT  ****/

// Data 365 pilot, no auth.
function startApp(cfg) {
    console.log(cfg);
    Donkeylift.app = new Donkeylift.AppData();
    Donkeylift.app.start(function () {
        Donkeylift.app.setSchema(cfg.database);
    });
}

/* 
// using api.donkeylift.com and Auth0 
function startApp(cfg) {

    Donkeylift.app = new Donkeylift.AppData();

    $.post(Donkeylift.env.API_BASE + "/public/login", {
        email: cfg.email,
        password: cfg.password

    }, function (data) {
        //console.log(data);
        sessionStorage.setItem('id_token', data.id_token);
        Donkeylift.app.start(function () {
            Donkeylift.app.setSchema(cfg.database);
        });
    });
}
*/
