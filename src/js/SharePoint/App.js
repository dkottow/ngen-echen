'use strict';


// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {

    login({
        tenant: Data365.config.azureTenant,
        clientId: Data365.config.aadApplicationId,
        ajax: Donkeylift.ajax //Data365 wraps ajax implementation

    }, function(err, auth, token) {
        if (err) {
            alert(err);
        } else {

            console.log('login ok...');  
            console.log(JSON.stringify(auth));

            Donkeylift.ajax = Data365.ajax; //adopt the ajax wrapper including AAD token
            
            /* 
             * $DATA365_APPLICATION injected from gulp. 
             * either Donkeylift.AppData or Donkeylift.AppSchema                        
             */

            Donkeylift.app = new $DATA365_APPLICATION({           
                server: Data365.config.d365Server,
                id_token: token                
            });

            var params = {
                site: _spPageContextInfo.siteAbsoluteUrl,
                user: auth.upn,
            };
            
            var db = getParameterByName('d365_database');
            if (db && db.indexOf('$') > 0) {
                params.account = db.split('$')[0];
                params.database = db.split('$')[1];
            }

            Donkeylift.app.start(params);
        }

        //add AAD token to links
        if (getParameterByName('id_token')) {
            var href = $('.d365-anchor').attr('href') + "#id_token=" + getParameterByName('id_token');
            $('.d365-anchor').attr('href', href);
        }

        //hide top level menu options
        $('.ms-core-deltaSuiteLinks').hide(); 
    });

});

