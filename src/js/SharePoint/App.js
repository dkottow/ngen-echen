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
        
            /* 
             * $DATA365_APPLICATION injected from gulp. 
             * either Donkeylift.AppData or Donkeylift.AppSchema                        
             */
            
            Donkeylift.app = new $DATA365_APPLICATION({           
                server: Data365.config.d365Server,
                id_token: token                
            });

            Donkeylift.app.start({
                site: _spPageContextInfo.siteAbsoluteUrl,
                user: auth.upn
            });
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

