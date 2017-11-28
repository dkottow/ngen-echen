

var ADAL;

function login(config, cbAfter) {
    if ( ! ADAL) {
        ADAL = new AuthenticationContext({
            instance: 'https://login.microsoftonline.com/',
            //tenant: 'f13f4e23-741c-4146-af37-a7b5b7ad49c6', //COMMON OR YOUR TENANT ID - dev tenant (golderdev7.sharepoint.com)
            //clientId: 'be480875-3ee4-4224-838e-642ee69a7d90', //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on dev tenant
            tenant: config.tenant, //COMMON OR YOUR TENANT ID - tenant (golderassociates.sharepoint.com)
            clientId: config.clientId, //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on Golder tenant
            callback: cbAfterLogin(cbAfter),
            popUp: false
        });
    }

    ADAL.login();
}

function cbAfterLogin(cbAfter) {
    return function(err, token) {
        console.log('cbAfterLogin...');
        console.log('token: ' + token);
        if (err) {  
            console.error(err);
            cbAfter(err);
        } else {
            var attrs = jwt_decode(token);
            cbAfter(null, attrs, token);
        }
    }
}
