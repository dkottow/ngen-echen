'use strict';

var config = {
    tenant: '46b66e86-3482-4192-842f-3472ff5fe764',
    clientId: '7a3c34b5-2f2b-4c45-a317-242ac3f48114',
    server: "https://azd365devwuas.azurewebsites.net",
    account: "test",        
    database: "SolomonMine_HydroDB_02"
}

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {
    login({
        tenant: config.tenant,
        clientId: config.clientId        
    }, function(err, attrs, token) {
        if (err) alert(err);
        else startDataBrowser({
            user: attrs.upn,
            id_token: token
        });
    });
});

function startDataBrowser(attrs) {
    console.log('startDataBrowser...');  

    startApp({
        server: config.server,
        account: config.account,
        database: config.database,
        user: attrs.user,
        id_token: attrs.id_token
    });

}

/**** DONKEYLIFT  ****/

// Data 365 hardcoded D365 database.

// Data 365 pilot, no auth.
function startApp(cfg) {
    console.log('startDataBrowser...');  
    console.log(cfg);
    Donkeylift.app = new Donkeylift.AppData();
    Donkeylift.app.start(cfg, function () {
        Donkeylift.app.setSchema(cfg.database);
    });
}

