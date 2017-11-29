'use strict';


// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {
    login({
        tenant: Data365.config.azureTenant,
        clientId: Data365.config.aadApplicationId        

    }, function(err, auth, token) {
        if (err) {
            alert(err);
        } else {

            console.log('login ok...');  
            console.log(JSON.stringify(auth));
        
            // Donkeylift.AppData or Donkeylift.AppSchema                        
            Donkeylift.app = new $DATA365_APPLICATION({
                server: Data365.config.d365Server
            });

            Donkeylift.app.start({
                site: _spPageContextInfo.siteAbsoluteUrl,
                account: Data365.config.d365Account,
                user: auth.upn,
                id_token: token
            }, function () {
                Donkeylift.app.setSchema(Data365.config.d365Database);
            });
        }
    });
});

