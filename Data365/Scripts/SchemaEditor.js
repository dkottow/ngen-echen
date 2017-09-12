'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {
    startSchemaEditor();
});

function startSchemaEditor() {
    Config.get(function (cfg) {
        startApp(cfg);
    });
}

/**** DONKEYLIFT  ****/

// Data 365 pilot, no auth.
function startApp(cfg) {

    sessionStorage.setItem('dl_account', cfg.account);
    sessionStorage.setItem('dl_user', cfg.user);

    Donkeylift.app = new Donkeylift.AppSchema();

    Donkeylift.app.start(function () {
        Donkeylift.app.setSchema(cfg.database);
    });
}

