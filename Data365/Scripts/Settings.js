'use strict';

// This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
$(document).ready(function () {

    startDefault();

    $('select[name="dl_database"]').change(function () {
        Config.update({
            account: $('input[name="dl_account"]').val(),
            database: $('select[name="dl_database"]').val()
        });
    });
});

function startDefault()
{

    Config.get(function (cfg) {
        $('input[name="dl_account"]').val(cfg.account);

        var url = 'https://azd365devwuas.azurewebsites.net' + '/' + cfg.account;
        $.get(url, function (data) {
            console.log(data);

            $.each(data.databases, function (name, def) {
                $('select[name="dl_database"]').append($('<option>', {
                    value: name,
                    text: name
                }));

                //try to set current
                $('select[name="dl_database"]').val(cfg.database);
            });
        });
    });

}

//ADAL stuff...

var ADAL = new AuthenticationContext({
    instance: 'https://login.microsoftonline.com/',
    tenant: 'f13f4e23-741c-4146-af37-a7b5b7ad49c6', //COMMON OR YOUR TENANT ID - dev tenant (golderdev7.sharepoint.com)
    clientId: 'be480875-3ee4-4224-838e-642ee69a7d90', //REPLACE WITH YOUR CLIENT ID - Data365 AAD app on dev tenant
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


