'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {
    startSchemaEditor();
});

function startSchemaEditor() {

    startApp({
        user: _spPageContextInfo.userLoginName,
        server: "https://azd365testwuas.azurewebsites.net",
        account: "test",
        database: "SolomonMine_HydroDB_02"
    });
}

/**** DONKEYLIFT  ****/

// Data 365 pilot, no auth.
function startApp(cfg) {
    Donkeylift.app = new Donkeylift.AppSchema();
    Donkeylift.app.start(cfg, function () {
        Donkeylift.app.setSchema(cfg.database);
    });
}

