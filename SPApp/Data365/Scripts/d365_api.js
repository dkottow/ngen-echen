
var Data365 = {

    config : {
        azureTenant: '46b66e86-3482-4192-842f-3472ff5fe764', //Golder
        aadApplicationId: '7a3c34b5-2f2b-4c45-a317-242ac3f48114', //Data365
        d365Server: "https://azd365devwuas.azurewebsites.net",
    }
           
};


window.onload = function() {
    
    login({
        tenant: Data365.config.azureTenant,
        clientId: Data365.config.aadApplicationId        

    }, function(err, auth, token) {
        if (err) {
            alert(err);
        } else {

            console.log('login ok...');  
            console.log(JSON.stringify(auth));
    
            const ui = SwaggerUIBundle({
                url: "https://azd365devwuas.azurewebsites.net/public/swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            })

            window.ui = ui
        }
    });
}


function login(config, cbAfter) {

    var token = getParameterByName("id_token");
    if (token) {
        //we have been redirected successfully from AAD login process
        var attrs = jwt_decode(token);
        cbAfter(null, attrs, token);    
        return;
    }

    var ADAL = new AuthenticationContext({
        instance: 'https://login.microsoftonline.com/',
        tenant: config.tenant, //COMMON OR YOUR TENANT ID - golderassociates.sharepoint.com
        clientId: config.clientId, //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on Golder tenant
        callback: cbAfterLogin(cbAfter),
        popUp: false
    });

    ADAL.login();        
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
!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};b[g][0].call(j.exports,function(a){var c=b[g][1][a];return e(c?c:a)},j,j.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){function d(a){this.message=a}function e(a){var b=String(a).replace(/=+$/,"");if(b.length%4==1)throw new d("'atob' failed: The string to be decoded is not correctly encoded.");for(var c,e,g=0,h=0,i="";e=b.charAt(h++);~e&&(c=g%4?64*c+e:e,g++%4)?i+=String.fromCharCode(255&c>>(-2*g&6)):0)e=f.indexOf(e);return i}var f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";d.prototype=new Error,d.prototype.name="InvalidCharacterError",b.exports="undefined"!=typeof window&&window.atob||e},{}],2:[function(a,b,c){function d(a){return decodeURIComponent(e(a).replace(/(.)/g,function(a,b){var c=b.charCodeAt(0).toString(16).toUpperCase();return c.length<2&&(c="0"+c),"%"+c}))}var e=a("./atob");b.exports=function(a){var b=a.replace(/-/g,"+").replace(/_/g,"/");switch(b.length%4){case 0:break;case 2:b+="==";break;case 3:b+="=";break;default:throw"Illegal base64url string!"}try{return d(b)}catch(c){return e(b)}}},{"./atob":1}],3:[function(a,b,c){"use strict";var d=a("./base64_url_decode");b.exports=function(a){if(!a)throw new Error("Invalid token specified");return JSON.parse(d(a.split(".")[1]))}},{"./base64_url_decode":2}],4:[function(a,b,c){var d="undefined"!=typeof self?self:"undefined"!=typeof window?window:{},e=a("./lib/index");"function"==typeof d.window.define&&d.window.define.amd?d.window.define("jwt_decode",function(){return e}):d.window&&(d.window.jwt_decode=e)},{"./lib/index":3}]},{},[4]);
/*! adal-angular v1.0.15 2017-07-19 */
var AuthenticationContext=function(){"use strict";return AuthenticationContext=function(a){if(this.REQUEST_TYPE={LOGIN:"LOGIN",RENEW_TOKEN:"RENEW_TOKEN",UNKNOWN:"UNKNOWN"},this.CONSTANTS={ACCESS_TOKEN:"access_token",EXPIRES_IN:"expires_in",ID_TOKEN:"id_token",ERROR_DESCRIPTION:"error_description",SESSION_STATE:"session_state",STORAGE:{TOKEN_KEYS:"adal.token.keys",ACCESS_TOKEN_KEY:"adal.access.token.key",EXPIRATION_KEY:"adal.expiration.key",STATE_LOGIN:"adal.state.login",STATE_RENEW:"adal.state.renew",NONCE_IDTOKEN:"adal.nonce.idtoken",SESSION_STATE:"adal.session.state",USERNAME:"adal.username",IDTOKEN:"adal.idtoken",ERROR:"adal.error",ERROR_DESCRIPTION:"adal.error.description",LOGIN_REQUEST:"adal.login.request",LOGIN_ERROR:"adal.login.error",RENEW_STATUS:"adal.token.renew.status"},RESOURCE_DELIMETER:"|",LOADFRAME_TIMEOUT:"6000",TOKEN_RENEW_STATUS_CANCELED:"Canceled",TOKEN_RENEW_STATUS_COMPLETED:"Completed",TOKEN_RENEW_STATUS_IN_PROGRESS:"In Progress",LOGGING_LEVEL:{ERROR:0,WARN:1,INFO:2,VERBOSE:3},LEVEL_STRING_MAP:{0:"ERROR:",1:"WARNING:",2:"INFO:",3:"VERBOSE:"},POPUP_WIDTH:483,POPUP_HEIGHT:600},AuthenticationContext.prototype._singletonInstance)return AuthenticationContext.prototype._singletonInstance;if(AuthenticationContext.prototype._singletonInstance=this,this.instance="https://login.microsoftonline.com/",this.config={},this.callback=null,this.popUp=!1,this.isAngular=!1,this._user=null,this._activeRenewals={},this._loginInProgress=!1,this._acquireTokenInProgress=!1,window.renewStates=[],window.callBackMappedToRenewStates={},window.callBacksMappedToRenewStates={},a.displayCall&&"function"!=typeof a.displayCall)throw new Error("displayCall is not a function");if(!a.clientId)throw new Error("clientId is required");this.config=this._cloneConfig(a),void 0===this.config.navigateToLoginRequestUrl&&(this.config.navigateToLoginRequestUrl=!0),this.config.popUp&&(this.popUp=!0),this.config.callback&&"function"==typeof this.config.callback&&(this.callback=this.config.callback),this.config.instance&&(this.instance=this.config.instance),this.config.loginResource||(this.config.loginResource=this.config.clientId),this.config.redirectUri||(this.config.redirectUri=window.location.href.split("?")[0].split("#")[0]),this.config.postLogoutRedirectUri||(this.config.postLogoutRedirectUri=window.location.href.split("?")[0].split("#")[0]),this.config.anonymousEndpoints||(this.config.anonymousEndpoints=[]),this.config.isAngular&&(this.isAngular=this.config.isAngular)},window.Logging={level:0,log:function(a){}},AuthenticationContext.prototype.login=function(a){if(this._loginInProgress)return void this.info("Login in progress");var b=this._guid();this.config.state=b,this._idTokenNonce=this._guid(),this.verbose("Expected state: "+b+" startPage:"+window.location.href),this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST,a||window.location.href),this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR,""),this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN,b),this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN,this._idTokenNonce),this._saveItem(this.CONSTANTS.STORAGE.ERROR,""),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,"");var c=this._getNavigateUrl("id_token",null)+"&nonce="+encodeURIComponent(this._idTokenNonce);this._loginInProgress=!0,this.config.displayCall?this.config.displayCall(c):this.popUp?this._loginPopup(c):this.promptUser(c)},AuthenticationContext.prototype._openPopup=function(a,b,c,d){try{var e=window.screenLeft?window.screenLeft:window.screenX,f=window.screenTop?window.screenTop:window.screenY,g=window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth,h=window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight,i=g/2-c/2+e,j=h/2-d/2+f,k=window.open(a,b,"width="+c+", height="+d+", top="+j+", left="+i);return k.focus&&k.focus(),k}catch(a){return this.warn("Error opening popup, "+a.message),this._loginInProgress=!1,null}},AuthenticationContext.prototype._loginPopup=function(a,b,c){var d=this._openPopup(a,"login",this.CONSTANTS.POPUP_WIDTH,this.CONSTANTS.POPUP_HEIGHT),e=c||this.callback;if(null==d)return this.warn("Popup Window is null. This can happen if you are using IE"),this._saveItem(this.CONSTANTS.STORAGE.ERROR,"Error opening popup"),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,"Popup Window is null. This can happen if you are using IE"),this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR,"Popup Window is null. This can happen if you are using IE"),b&&this._activeRenewals[b]&&(this._activeRenewals[b]=null),this._loginInProgress=!1,this._acquireTokenInProgress=!1,void(e&&e(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION),null,this._getItem(this.CONSTANTS.STORAGE.ERROR)));if(-1!=this.config.redirectUri.indexOf("#"))var f=this.config.redirectUri.split("#")[0];else var f=this.config.redirectUri;var g=this,h=window.setInterval(function(){d&&!d.closed&&void 0!==d.closed||(g._loginInProgress=!1,g._acquireTokenInProgress=!1,b&&g._activeRenewals[b]&&(g._activeRenewals[b]=null),window.clearInterval(h));try{-1!=d.location.href.indexOf(f)&&(g.isAngular?g._onPopUpHashChanged(d.location.hash):g.handleWindowCallback(d.location.hash),window.clearInterval(h),g._loginInProgress=!1,g._acquireTokenInProgress=!1,g.info("Closing popup window"),d.close())}catch(a){}},1)},AuthenticationContext.prototype._onPopUpHashChanged=function(a){!function(){function a(a,b){b=b||{bubbles:!1,cancelable:!1,detail:void 0};var c=document.createEvent("CustomEvent");return c.initCustomEvent(a,b.bubbles,b.cancelable,b.detail),c}if("function"==typeof window.CustomEvent)return!1;a.prototype=window.Event.prototype,window.CustomEvent=a}();var b=new CustomEvent("adal:popUpHashChanged",{detail:a});window.dispatchEvent(b)},AuthenticationContext.prototype.loginInProgress=function(){return this._loginInProgress},AuthenticationContext.prototype._hasResource=function(a){var b=this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS);return b&&!this._isEmpty(b)&&b.indexOf(a+this.CONSTANTS.RESOURCE_DELIMETER)>-1},AuthenticationContext.prototype.getCachedToken=function(a){if(!this._hasResource(a))return null;var b=this._getItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY+a),c=this._getItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY+a),d=this.config.expireOffsetSeconds||300;return c&&c>this._now()+d?b:(this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY+a,""),this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY+a,0),null)},AuthenticationContext.prototype.getCachedUser=function(){if(this._user)return this._user;var a=this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);return this._user=this._createUser(a),this._user},AuthenticationContext.prototype.registerCallback=function(a,b,c){this._activeRenewals[b]=a,window.callBacksMappedToRenewStates[a]||(window.callBacksMappedToRenewStates[a]=[]);var d=this;window.callBacksMappedToRenewStates[a].push(c),window.callBackMappedToRenewStates[a]||(window.callBackMappedToRenewStates[a]=function(c,e,f){d._activeRenewals[b]=null;for(var g=0;g<window.callBacksMappedToRenewStates[a].length;++g)try{window.callBacksMappedToRenewStates[a][g](c,e,f)}catch(f){d.warn(f)}window.callBacksMappedToRenewStates[a]=null,window.callBackMappedToRenewStates[a]=null})},AuthenticationContext.prototype._renewToken=function(a,b){this.info("renewToken is called for resource:"+a);var c=this._addAdalFrame("adalRenewFrame"+a),d=this._guid()+"|"+a;this.config.state=d,window.renewStates.push(d),this.verbose("Renew token Expected state: "+d);var e=this._getNavigateUrl("token",a)+"&prompt=none";e=this._addHintParameters(e),this.registerCallback(d,a,b),this.verbose("Navigate to:"+e),c.src="about:blank",this._loadFrameTimeout(e,"adalRenewFrame"+a,a)},AuthenticationContext.prototype._renewIdToken=function(a){this.info("renewIdToken is called");var b=this._addAdalFrame("adalIdTokenFrame"),c=this._guid()+"|"+this.config.clientId;this._idTokenNonce=this._guid(),this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN,this._idTokenNonce),this.config.state=c,window.renewStates.push(c),this.verbose("Renew Idtoken Expected state: "+c);var d=this._getNavigateUrl("id_token",null)+"&prompt=none";d=this._addHintParameters(d),d+="&nonce="+encodeURIComponent(this._idTokenNonce),this.registerCallback(c,this.config.clientId,a),this.idTokenNonce=null,this.verbose("Navigate to:"+d),b.src="about:blank",this._loadFrameTimeout(d,"adalIdTokenFrame",this.config.clientId)},AuthenticationContext.prototype._urlContainsQueryStringParameter=function(a,b){return new RegExp("[\\?&]"+a+"=").test(b)},AuthenticationContext.prototype._loadFrameTimeout=function(a,b,c){this.verbose("Set loading state to pending for: "+c),this._saveItem(this.CONSTANTS.STORAGE.RENEW_STATUS+c,this.CONSTANTS.TOKEN_RENEW_STATUS_IN_PROGRESS),this._loadFrame(a,b);var d=this;setTimeout(function(){if(d._getItem(d.CONSTANTS.STORAGE.RENEW_STATUS+c)===d.CONSTANTS.TOKEN_RENEW_STATUS_IN_PROGRESS){d.verbose("Loading frame has timed out after: "+d.CONSTANTS.LOADFRAME_TIMEOUT/1e3+" seconds for resource "+c);var a=d._activeRenewals[c];a&&window.callBackMappedToRenewStates[a]&&window.callBackMappedToRenewStates[a]("Token renewal operation failed due to timeout",null,"Token Renewal Failed"),d._saveItem(d.CONSTANTS.STORAGE.RENEW_STATUS+c,d.CONSTANTS.TOKEN_RENEW_STATUS_CANCELED)}},d.CONSTANTS.LOADFRAME_TIMEOUT)},AuthenticationContext.prototype._loadFrame=function(a,b){var c=this;c.info("LoadFrame: "+b);var d=b;setTimeout(function(){var b=c._addAdalFrame(d);""!==b.src&&"about:blank"!==b.src||(b.src=a,c._loadFrame(a,d))},500)},AuthenticationContext.prototype.acquireToken=function(a,b){if(this._isEmpty(a))return this.warn("resource is required"),void b("resource is required",null,"resource is required");var c=this.getCachedToken(a);return c?(this.info("Token is already in cache for resource:"+a),void b(null,c,null)):this._user?void(this._activeRenewals[a]?this.registerCallback(this._activeRenewals[a],a,b):a===this.config.clientId?(this.verbose("renewing idtoken"),this._renewIdToken(b)):this._renewToken(a,b)):(this.warn("User login is required"),void b("User login is required",null,"login required"))},AuthenticationContext.prototype.acquireTokenPopup=function(a,b,c,d){if(this._isEmpty(a))return this.warn("resource is required"),void d("resource is required",null,"resource is required");if(!this._user)return this.warn("User login is required"),void d("User login is required",null,"login required");if(this._acquireTokenInProgress)return this.warn("Acquire token interactive is already in progress"),void d("Acquire token interactive is already in progress",null,"Acquire token interactive is already in progress");var e=this._guid()+"|"+a;this.config.state=e,window.renewStates.push(e),this.verbose("Renew token Expected state: "+e);var f=this._getNavigateUrl("token",a)+"&prompt=select_account";if(b&&(f+=encodeURIComponent(b)),c&&-1===f.indexOf("&claims"))f+="&claims="+encodeURIComponent(c);else if(c&&-1!==f.indexOf("&claims"))throw new Error("Claims cannot be passed as an extraQueryParameter");f=this._addHintParameters(f),this._acquireTokenInProgress=!0,this.info("acquireToken interactive is called for the resource "+a),this.registerCallback(e,a,d),this._loginPopup(f,a,d)},AuthenticationContext.prototype.acquireTokenRedirect=function(a,b,c){if(this._isEmpty(a))return this.warn("resource is required"),void callback("resource is required",null,"resource is required");if(!this._user)return this.warn("User login is required"),void callback("User login is required",null,"login required");if(this._acquireTokenInProgress)return this.warn("Acquire token interactive is already in progress"),void callback("Acquire token interactive is already in progress",null,"Acquire token interactive is already in progress");var d=this._guid()+"|"+a;this.config.state=d,window.renewStates.push(d),this.verbose("Renew token Expected state: "+d);var e=this._getNavigateUrl("token",a)+"&prompt=select_account";if(b&&(e+=encodeURIComponent(b)),c&&-1===e.indexOf("&claims"))e+="&claims="+encodeURIComponent(c);else if(c&&-1!==e.indexOf("&claims"))throw new Error("Claims cannot be passed as an extraQueryParameter");e=this._addHintParameters(e),this._acquireTokenInProgress=!0,this.info("acquireToken interactive is called for the resource "+a),this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST,window.location.href),this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW,d),this.promptUser(e)},AuthenticationContext.prototype.promptUser=function(a){a?(this.info("Navigate to:"+a),window.location.replace(a)):this.info("Navigate url is empty")},AuthenticationContext.prototype.clearCache=function(){this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY,""),this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY,0),this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE,""),this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN,""),window.renewStates=[],this._saveItem(this.CONSTANTS.STORAGE.USERNAME,""),this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN,""),this._saveItem(this.CONSTANTS.STORAGE.ERROR,""),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,"");var a=this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS);if(!this._isEmpty(a)){a=a.split(this.CONSTANTS.RESOURCE_DELIMETER);for(var b=0;b<a.length;b++)this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY+a[b],""),this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY+a[b],0)}this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS,"")},AuthenticationContext.prototype.clearCacheForResource=function(a){this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW,""),this._saveItem(this.CONSTANTS.STORAGE.ERROR,""),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,""),this._hasResource(a)&&(this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY+a,""),this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY+a,0))},AuthenticationContext.prototype.logOut=function(){this.clearCache(),this._user=null;var a;if(this.config.logOutUri)a=this.config.logOutUri;else{var b="common",c="";this.config.tenant&&(b=this.config.tenant),this.config.postLogoutRedirectUri&&(c="post_logout_redirect_uri="+encodeURIComponent(this.config.postLogoutRedirectUri)),a=this.instance+b+"/oauth2/logout?"+c}this.info("Logout navigate to: "+a),this.promptUser(a)},AuthenticationContext.prototype._isEmpty=function(a){return void 0===a||!a||0===a.length},AuthenticationContext.prototype.getUser=function(a){if("function"!=typeof a)throw new Error("callback is not a function");if(this._user)return void a(null,this._user);var b=this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);this._isEmpty(b)?(this.warn("User information is not available"),a("User information is not available",null)):(this.info("User exists in cache: "),this._user=this._createUser(b),a(null,this._user))},AuthenticationContext.prototype._addHintParameters=function(a){if(this._user&&this._user.profile&&this._user.profile.hasOwnProperty("upn")&&(this._urlContainsQueryStringParameter("login_hint",a)||(a+="&login_hint="+encodeURIComponent(this._user.profile.upn)),!this._urlContainsQueryStringParameter("domain_hint",a)&&this._user.profile.upn.indexOf("@")>-1)){var b=this._user.profile.upn.split("@");a+="&domain_hint="+encodeURIComponent(b[b.length-1])}return a},AuthenticationContext.prototype._createUser=function(a){var b=null,c=this._extractIdToken(a);return c&&c.hasOwnProperty("aud")&&(c.aud.toLowerCase()===this.config.clientId.toLowerCase()?(b={userName:"",profile:c},c.hasOwnProperty("upn")?b.userName=c.upn:c.hasOwnProperty("email")&&(b.userName=c.email)):this.warn("IdToken has invalid aud field")),b},AuthenticationContext.prototype._getHash=function(a){return a.indexOf("#/")>-1?a=a.substring(a.indexOf("#/")+2):a.indexOf("#")>-1&&(a=a.substring(1)),a},AuthenticationContext.prototype.isCallback=function(a){a=this._getHash(a);var b=this._deserialize(a);return b.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION)||b.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN)||b.hasOwnProperty(this.CONSTANTS.ID_TOKEN)},AuthenticationContext.prototype.getLoginError=function(){return this._getItem(this.CONSTANTS.STORAGE.LOGIN_ERROR)},AuthenticationContext.prototype.getRequestInfo=function(a){a=this._getHash(a);var b=this._deserialize(a),c={valid:!1,parameters:{},stateMatch:!1,stateResponse:"",requestType:this.REQUEST_TYPE.UNKNOWN};if(b&&(c.parameters=b,b.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION)||b.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN)||b.hasOwnProperty(this.CONSTANTS.ID_TOKEN))){c.valid=!0;var d="";if(!b.hasOwnProperty("state"))return this.warn("No state returned"),c;if(this.verbose("State: "+b.state),d=b.state,c.stateResponse=d,d===this._getItem(this.CONSTANTS.STORAGE.STATE_LOGIN))return c.requestType=this.REQUEST_TYPE.LOGIN,c.stateMatch=!0,c;if(d===this._getItem(this.CONSTANTS.STORAGE.STATE_RENEW))return c.requestType=this.REQUEST_TYPE.RENEW_TOKEN,c.stateMatch=!0,c;if(!c.stateMatch&&window.parent)for(var e=window.parent.renewStates,f=0;f<e.length;f++)if(e[f]===c.stateResponse){c.requestType=this.REQUEST_TYPE.RENEW_TOKEN,c.stateMatch=!0;break}}return c},AuthenticationContext.prototype._getResourceFromState=function(a){if(a){var b=a.indexOf("|");if(b>-1&&b+1<a.length)return a.substring(b+1)}return""},AuthenticationContext.prototype.saveTokenFromHash=function(a){this.info("State status:"+a.stateMatch+"; Request type:"+a.requestType),this._saveItem(this.CONSTANTS.STORAGE.ERROR,""),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,"");var b=this._getResourceFromState(a.stateResponse);if(a.parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION))this.info("Error :"+a.parameters.error+"; Error description:"+a.parameters[this.CONSTANTS.ERROR_DESCRIPTION]),this._saveItem(this.CONSTANTS.STORAGE.ERROR,a.parameters.error),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,a.parameters[this.CONSTANTS.ERROR_DESCRIPTION]),a.requestType===this.REQUEST_TYPE.LOGIN&&(this._loginInProgress=!1,this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR,a.parameters.error_description));else if(a.stateMatch){this.info("State is right"),a.parameters.hasOwnProperty(this.CONSTANTS.SESSION_STATE)&&this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE,a.parameters[this.CONSTANTS.SESSION_STATE]);var c;a.parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN)&&(this.info("Fragment has access token"),this._hasResource(b)||(c=this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS)||"",this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS,c+b+this.CONSTANTS.RESOURCE_DELIMETER)),this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY+b,a.parameters[this.CONSTANTS.ACCESS_TOKEN]),this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY+b,this._expiresIn(a.parameters[this.CONSTANTS.EXPIRES_IN]))),a.parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)&&(this.info("Fragment has id token"),this._loginInProgress=!1,this._user=this._createUser(a.parameters[this.CONSTANTS.ID_TOKEN]),this._user&&this._user.profile?this._user.profile.nonce!==this._getItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN)?(this._user=null,this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR,"Nonce is not same as "+this._idTokenNonce)):(this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN,a.parameters[this.CONSTANTS.ID_TOKEN]),b=this.config.loginResource?this.config.loginResource:this.config.clientId,this._hasResource(b)||(c=this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS)||"",this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS,c+b+this.CONSTANTS.RESOURCE_DELIMETER)),this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY+b,a.parameters[this.CONSTANTS.ID_TOKEN]),this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY+b,this._user.profile.exp)):(this._saveItem(this.CONSTANTS.STORAGE.ERROR,"invalid id_token"),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,"Invalid id_token. id_token: "+a.parameters[this.CONSTANTS.ID_TOKEN])))}else this._saveItem(this.CONSTANTS.STORAGE.ERROR,"Invalid_state"),this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION,"Invalid_state. state: "+a.stateResponse);this._saveItem(this.CONSTANTS.STORAGE.RENEW_STATUS+b,this.CONSTANTS.TOKEN_RENEW_STATUS_COMPLETED)},AuthenticationContext.prototype.getResourceForEndpoint=function(a){if(this.config&&this.config.anonymousEndpoints)for(var b=0;b<this.config.anonymousEndpoints.length;b++)if(a.indexOf(this.config.anonymousEndpoints[b])>-1)return null;if(this.config&&this.config.endpoints)for(var c in this.config.endpoints)if(a.indexOf(c)>-1)return this.config.endpoints[c];return a.indexOf("http://")>-1||a.indexOf("https://")>-1?this._getHostFromUri(a)===this._getHostFromUri(this.config.redirectUri)?this.config.loginResource:null:this.config.loginResource},AuthenticationContext.prototype._getHostFromUri=function(a){var b=String(a).replace(/^(https?:)\/\//,"");return b=b.split("/")[0]},AuthenticationContext.prototype.handleWindowCallback=function(a){if(null==a&&(a=window.location.hash),this.isCallback(a)){var b=this.getRequestInfo(a);this.info("Returned from redirect url"),this.saveTokenFromHash(b);var c=null,d=null;b.requestType===this.REQUEST_TYPE.RENEW_TOKEN&&window.parent?(this.verbose("Window is in iframe"),d=window.parent.callBackMappedToRenewStates[b.stateResponse],c=b.parameters[this.CONSTANTS.ACCESS_TOKEN]||b.parameters[this.CONSTANTS.ID_TOKEN]):b.requestType===this.REQUEST_TYPE.LOGIN&&(d=this.callback,c=b.parameters[this.CONSTANTS.ID_TOKEN]);try{d&&d(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION),c,this._getItem(this.CONSTANTS.STORAGE.ERROR))}catch(a){this.error("Error occurred in user defined callback function",a)}this.popUp||(window.location.hash="",this.config.navigateToLoginRequestUrl&&(window.location.href=this._getItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST)))}},AuthenticationContext.prototype._getNavigateUrl=function(a,b){var c="common";this.config.tenant&&(c=this.config.tenant);var d=this.instance+c+"/oauth2/authorize"+this._serialize(a,this.config,b)+this._addLibMetadata();return this.info("Navigate url:"+d),d},AuthenticationContext.prototype._extractIdToken=function(a){var b=this._decodeJwt(a);if(!b)return null;try{var c=b.JWSPayload,d=this._base64DecodeStringUrlSafe(c);return d?JSON.parse(d):(this.info("The returned id_token could not be base64 url safe decoded."),null)}catch(a){this.error("The returned id_token could not be decoded",a)}return null},AuthenticationContext.prototype._base64DecodeStringUrlSafe=function(a){return a=a.replace(/-/g,"+").replace(/_/g,"/"),window.atob?decodeURIComponent(escape(window.atob(a))):decodeURIComponent(escape(this._decode(a)))},AuthenticationContext.prototype._decode=function(a){var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";a=String(a).replace(/=+$/,"");var c=a.length;if(c%4==1)throw new Error("The token to be decoded is not correctly encoded.");for(var d,e,f,g,h,i,j,k,l="",m=0;m<c;m+=4){if(d=b.indexOf(a.charAt(m)),e=b.indexOf(a.charAt(m+1)),f=b.indexOf(a.charAt(m+2)),g=b.indexOf(a.charAt(m+3)),m+2===c-1){h=d<<18|e<<12|f<<6,i=h>>16&255,j=h>>8&255,l+=String.fromCharCode(i,j);break}if(m+1===c-1){h=d<<18|e<<12,i=h>>16&255,l+=String.fromCharCode(i);break}h=d<<18|e<<12|f<<6|g,i=h>>16&255,j=h>>8&255,k=255&h,l+=String.fromCharCode(i,j,k)}return l},AuthenticationContext.prototype._decodeJwt=function(a){if(this._isEmpty(a))return null;var b=/^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/,c=b.exec(a);return!c||c.length<4?(this.warn("The returned id_token is not parseable."),null):{header:c[1],JWSPayload:c[2],JWSSig:c[3]}},AuthenticationContext.prototype._convertUrlSafeToRegularBase64EncodedString=function(a){return a.replace("-","+").replace("_","/")},AuthenticationContext.prototype._serialize=function(a,b,c){var d=[];if(null!==b){d.push("?response_type="+a),d.push("client_id="+encodeURIComponent(b.clientId)),c&&d.push("resource="+encodeURIComponent(c)),d.push("redirect_uri="+encodeURIComponent(b.redirectUri)),d.push("state="+encodeURIComponent(b.state)),b.hasOwnProperty("slice")&&d.push("slice="+encodeURIComponent(b.slice)),b.hasOwnProperty("extraQueryParameter")&&d.push(b.extraQueryParameter);var e=b.correlationId?b.correlationId:this._guid();d.push("client-request-id="+encodeURIComponent(e))}return d.join("&")},AuthenticationContext.prototype._deserialize=function(a){var b,c=/\+/g,d=/([^&=]+)=([^&]*)/g,e=function(a){return decodeURIComponent(a.replace(c," "))},f={};for(b=d.exec(a);b;)f[e(b[1])]=e(b[2]),b=d.exec(a);return f},AuthenticationContext.prototype._decimalToHex=function(a){for(var b=a.toString(16);b.length<2;)b="0"+b;return b},AuthenticationContext.prototype._guid=function(){var a=window.crypto||window.msCrypto;if(a&&a.getRandomValues){var b=new Uint8Array(16);return a.getRandomValues(b),b[6]|=64,b[6]&=79,b[8]|=128,b[8]&=191,this._decimalToHex(b[0])+this._decimalToHex(b[1])+this._decimalToHex(b[2])+this._decimalToHex(b[3])+"-"+this._decimalToHex(b[4])+this._decimalToHex(b[5])+"-"+this._decimalToHex(b[6])+this._decimalToHex(b[7])+"-"+this._decimalToHex(b[8])+this._decimalToHex(b[9])+"-"+this._decimalToHex(b[10])+this._decimalToHex(b[11])+this._decimalToHex(b[12])+this._decimalToHex(b[13])+this._decimalToHex(b[14])+this._decimalToHex(b[15])}for(var c="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",d="0123456789abcdef",e=0,f="",g=0;g<36;g++)"-"!==c[g]&&"4"!==c[g]&&(e=16*Math.random()|0),"x"===c[g]?f+=d[e]:"y"===c[g]?(e&=3,e|=8,f+=d[e]):f+=c[g];return f},AuthenticationContext.prototype._expiresIn=function(a){return a||(a=3599),this._now()+parseInt(a,10)},AuthenticationContext.prototype._now=function(){return Math.round((new Date).getTime()/1e3)},AuthenticationContext.prototype._addAdalFrame=function(a){if(void 0!==a){this.info("Add adal frame to document:"+a);var b=document.getElementById(a);if(!b){if(document.createElement&&document.documentElement&&(window.opera||-1===window.navigator.userAgent.indexOf("MSIE 5.0"))){var c=document.createElement("iframe");c.setAttribute("id",a),c.style.visibility="hidden",c.style.position="absolute",c.style.width=c.style.height=c.borderWidth="0px",b=document.getElementsByTagName("body")[0].appendChild(c)}else document.body&&document.body.insertAdjacentHTML&&document.body.insertAdjacentHTML("beforeEnd",'<iframe name="'+a+'" id="'+a+'" style="display:none"></iframe>');window.frames&&window.frames[a]&&(b=window.frames[a])}return b}},AuthenticationContext.prototype._saveItem=function(a,b){return this.config&&this.config.cacheLocation&&"localStorage"===this.config.cacheLocation?this._supportsLocalStorage()?(localStorage.setItem(a,b),!0):(this.info("Local storage is not supported"),!1):this._supportsSessionStorage()?(sessionStorage.setItem(a,b),!0):(this.info("Session storage is not supported"),!1)},AuthenticationContext.prototype._getItem=function(a){return this.config&&this.config.cacheLocation&&"localStorage"===this.config.cacheLocation?this._supportsLocalStorage()?localStorage.getItem(a):(this.info("Local storage is not supported"),null):this._supportsSessionStorage()?sessionStorage.getItem(a):(this.info("Session storage is not supported"),null)},AuthenticationContext.prototype._supportsLocalStorage=function(){try{return!!window.localStorage&&(window.localStorage.setItem("storageTest","A"),"A"==window.localStorage.getItem("storageTest")&&(window.localStorage.removeItem("storageTest"),!window.localStorage.getItem("storageTest")))}catch(a){return!1}},AuthenticationContext.prototype._supportsSessionStorage=function(){try{return!!window.sessionStorage&&(window.sessionStorage.setItem("storageTest","A"),"A"==window.sessionStorage.getItem("storageTest")&&(window.sessionStorage.removeItem("storageTest"),!window.sessionStorage.getItem("storageTest")))}catch(a){return!1}},AuthenticationContext.prototype._cloneConfig=function(a){if(null===a||"object"!=typeof a)return a;var b={};for(var c in a)a.hasOwnProperty(c)&&(b[c]=a[c]);return b},AuthenticationContext.prototype._addLibMetadata=function(){return"&x-client-SKU=Js&x-client-Ver="+this._libVersion()},AuthenticationContext.prototype.log=function(a,b,c){if(a<=Logging.level){var d=(new Date).toUTCString(),e="";e=this.config.correlationId?d+":"+this.config.correlationId+"-"+this._libVersion()+"-"+this.CONSTANTS.LEVEL_STRING_MAP[a]+" "+b:d+":"+this._libVersion()+"-"+this.CONSTANTS.LEVEL_STRING_MAP[a]+" "+b,c&&(e+="\nstack:\n"+c.stack),Logging.log(e)}},AuthenticationContext.prototype.error=function(a,b){this.log(this.CONSTANTS.LOGGING_LEVEL.ERROR,a,b)},AuthenticationContext.prototype.warn=function(a){this.log(this.CONSTANTS.LOGGING_LEVEL.WARN,a,null)},AuthenticationContext.prototype.info=function(a){this.log(this.CONSTANTS.LOGGING_LEVEL.INFO,a,null)},AuthenticationContext.prototype.verbose=function(a){this.log(this.CONSTANTS.LOGGING_LEVEL.VERBOSE,a,null)},AuthenticationContext.prototype._libVersion=function(){return"1.0.15"},"undefined"!=typeof module&&module.exports&&(module.exports=AuthenticationContext,module.exports.inject=function(a){return new AuthenticationContext(a)}),AuthenticationContext}();