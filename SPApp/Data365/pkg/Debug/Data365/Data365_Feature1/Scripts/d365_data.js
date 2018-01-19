
var Data365 = {

    config : {
        azureTenant: '46b66e86-3482-4192-842f-3472ff5fe764', //Golder
        aadApplicationId: '7a3c34b5-2f2b-4c45-a317-242ac3f48114', //Data365
        d365Server: "https://data365.golder.com",
    }
           
};


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
             * Donkeylift.AppData injected from gulp. 
             * either Donkeylift.AppData or Donkeylift.AppSchema                        
             */

            Donkeylift.app = new Donkeylift.AppData({           
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



function login(config, cbAfter) {

    var authContext = new AuthenticationContext({
        //instance: 'https://login.microsoftonline.com/',
        tenant: config.tenant, //COMMON OR YOUR TENANT ID - golderassociates.sharepoint.com
        clientId: config.clientId //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on Golder tenant
        //popUp: false
    });

    // Check For & Handle Redirect From AAD After Login
    authContext.handleWindowCallback();
        
    if ( ! authContext.getCachedUser()) {
        authContext.config.redirectUri = window.location.href;        
        authContext.login();
        return;
    }

    var ajaxFn = config.ajax; //config.ajax holds Donkeylift ajax impl. 

    Data365.ajax = function(url, settings) {
        console.log("Data365.ajax...");
        return new Promise(function(resolve, reject) {

            authContext.acquireToken(authContext.config.clientId, function(error, token) {
                if (error || !token) {
                    windows.alert("Error acquiring AAD token. Please reload page.");
                    console.log(error);
                    reject(error);

                } else {
                    //add AAD token to ajax request header    
                    settings = settings || {}; settings.headers = settings.headers || {};
                    settings.headers['Authorization'] = 'Bearer ' + token;

                    ajaxFn(url, settings).then(function(result) {
                        console.log("ajaxFn.then ...Data365.ajax");
                        resolve(result);
                    }).catch(function(result) {
                        console.log("ajaxFn.catch ...Data365.ajax");
                        reject(result);                        
                    });
                }    
            });
        });    
    }

    authContext.acquireToken(authContext.config.clientId, function(error, token) {
        console.log("authContext.acquireToken...");
        if (error || !token) {
            windows.alert("Error acquiring AAD token");
            console.log(error);
            return;
        }

        var attrs = jwt_decode(token);
        cbAfter(null, attrs, token);        
    });

}

function cbAfterLogin(cbAfter) {
    /*
     * given the configuration of ADAL (popUp = false) cbAfter will not be called.
     * instead the user will be redirected to another page login by ADAL.login() 
     * and then back to ours with the token in the URL (see above)
     * 
     * However, if we would change to popUp = true the user does not leave our page 
     * and the app flow would continue after login through cbAfter()
     */ 
    return function(err, token) {
        console.log('cbAfterLogin...');
        console.log('token: ' + token);
        if (err) {  
            console.log(err);
            alert(err.message);
            cbAfter(err);            
        } else {
            var attrs = jwt_decode(token);
            cbAfter(null, attrs, token);
        }
    }
}

//stackoverflow - https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
//dk slightly modified to find "query parameter" in hash of url
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&#]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}