
function login(config, cbAfter) {

/*    
    var token = getParameterByName("id_token");
    if (token) {
        //we have been redirected successfully from AAD login process
        var attrs = jwt_decode(token);
        cbAfter(null, attrs, token);    
        return;
    }

    authContext.login();
*/
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