
function login(config, cbAfter) {
    var ajaxFn = config.ajax; //config.ajax holds Donkeylift ajax impl. 

    Data365.ajax = function(url, settings) {

        //add AAD token to ajax request header    
        settings = settings || {}; 
        settings.xhrFields = { withCredentials: true };
        return ajaxFn(url, settings);
    }

    var attrs = { 
        upn: _spPageContextInfo.userLoginName 
    };

    var lid = setInterval(function() {
        if (Data365.env.remotePartyLoaded) {
            clearInterval(lid);
            cbAfter(null, attrs); //no auth token        
        }
    }, 100);

}

function login_adal(config, cbAfter) {

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