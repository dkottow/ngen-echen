'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {

    startDefault();

});

function startDefault()
{
    Config.get(function (cfg) {

        if (cfg.server) {
            //update ui
            $('input[name="dl_server"]').val(cfg.server);
            $('input[name="dl_account"]').val(cfg.account);
        } else { 
            //read from ui. html input elems initial values    
            cfg.server = $('input[name="dl_server"]').val();
            cfg.account = $('input[name="dl_account"]').val();
        }    
        var url = cfg.server + '/' + cfg.account;
        $.get(url, function (data) {
            console.log(data);

            $.each(data.databases, function (name, def) {
                $('select[name="dl_database"]').append($('<option>', {
                    value: name,
                    text: name
                }));
            });
            
            $('select[name="dl_database"]').change(function () {
                Config.update({
                    server: $('input[name="dl_server"]').val(),
                    account: $('input[name="dl_account"]').val(),
                    database: $('select[name="dl_database"]').val()
                });
            });

            //try to set current
            if (cfg.database) {
                $('select[name="dl_database"]').val(cfg.database);
            } else {
                cfg.database = $('select[name="dl_database"]').val();                   
            }
            
            Config.update(cfg);
        });
    });

}

//ADAL stuff...

var ADAL = new AuthenticationContext({
    instance: 'https://login.microsoftonline.com/',
    //tenant: 'f13f4e23-741c-4146-af37-a7b5b7ad49c6', //COMMON OR YOUR TENANT ID - dev tenant (golderdev7.sharepoint.com)
    //clientId: 'be480875-3ee4-4224-838e-642ee69a7d90', //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on dev tenant
    tenant: '46b66e86-3482-4192-842f-3472ff5fe764', //COMMON OR YOUR TENANT ID - tenant (golderassociates.sharepoint.com)
    clientId: '7a3c34b5-2f2b-4c45-a317-242ac3f48114', //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on Golder tenant
    callback: userSignedIn,
    popUp: true
});

function signIn() {
    ADAL.login();
}

function userSignedIn(err, token) {
    console.log('userSignedIn called');
    if (!err) {
        console.log("token: " + token);
        showWelcomeMessage();
    }
    else {
        console.error("error: " + err);
    }
}

function showWelcomeMessage() {
    var user = ADAL.getCachedUser();
    var divWelcome = document.getElementById('WelcomeMessage');
    divWelcome.innerHTML = "Welcome " + user.profile.name;
}


