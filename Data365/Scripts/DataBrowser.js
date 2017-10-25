'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {
    startDataBrowser();
});

function startDataBrowser() {
    console.log('startDataBrowser');

    startApp({
        user: _spPageContextInfo.userLoginName,
        server: "https://azd365testwuas.azurewebsites.net",
        account: "test",
        database: "SolomonMine_HydroDB"
    });
/*
    Config.get(function (cfg) {
        startApp(cfg);
    });
*/

}

/**** DONKEYLIFT  ****/

// Data 365 hardcoded D365 database.

// Data 365 pilot, no auth.
function startApp(cfg) {
    console.log(cfg);
    Donkeylift.app = new Donkeylift.AppData();
    Donkeylift.app.start(cfg, function () {
        Donkeylift.app.setSchema(cfg.database);
    });
}

