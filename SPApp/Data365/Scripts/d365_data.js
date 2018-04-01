
var Data365 = {

    config : {
        azureTenant: '46b66e86-3482-4192-842f-3472ff5fe764', //Golder
        aadApplicationId: 'fdbf5216-d507-430d-a333-b49698dc266a', //Data365
        d365Server: "https://azd365prodwuas.azurewebsites.net",
    },

    env: {
        remotePartyLoaded: false //true once hidden iframe pointing to api loaded
    },    
};


'use strict';


// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function() {

    $('iframe').load(function() {
        console.log('iframe loaded. setting remotePartyLoaded');
        Data365.env.remotePartyLoaded = true;
    });

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
            //TODO check hash path
/*
getParameterByName("path", "https://golderassociates.sharepoint.com/sites/13017g/Developer%20UI/Pages/DataBrowser.aspx
    #path=AUS/FMG_SOLOMON_WATERMONITORING/Bore_Downhole_Equipment&$select=id,Pump_Status,mod_by,mod_on,add_by,add_on,Pump_Details_ref,Motor_Details_ref,Location_ref,AssetID,PumpID,MotorID,LocCode,Installation_Date,own_by,Decommissioned_Date,Non_Operating_Reason,Metered,Intake_Depth,Description,Riser_Material,Riser_Length,Riser_Diameter,Discharge_Adapt_Size,Comment,Headworks,Motor_status,Installed_By&$orderby=id asc&$skip=0&$top=10&counts=1&")
*/
            Donkeylift.app.start(params);
        }

        //add d365_database to links
        if (getParameterByName('d365_database')) {
            var href = $('.d365-anchor').attr('href') + "?d365_database=" + getParameterByName('d365_database');
            $('.d365-anchor').attr('href', href);
        }

        //hide top level menu options
        $('.ms-core-deltaSuiteLinks').hide(); 
    });

});



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