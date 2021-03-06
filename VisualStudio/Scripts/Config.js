﻿'use strict';

var Config = {};

Config.get = function(onSuccess) {

    var result = {
        user: sessionStorage.getItem('dl_user') || _spPageContextInfo.userLoginName,
        server: getParameterByName('dl_server') || sessionStorage.getItem('dl_server'),
        account: getParameterByName('dl_account') || sessionStorage.getItem('dl_account'),
        database: getParameterByName('dl_database') || sessionStorage.getItem('dl_database') || 'sandwiches'
    };
    console.log(result);

    if (!sessionStorage.getItem('dl_user')) {
        Config.update(result, onSuccess);
    } else {
        onSuccess(result);
    }
}

Config.update = function (fieldValues, onSuccess) {

    console.log(fieldValues);
    sessionStorage.setItem('dl_user', _spPageContextInfo.userLoginName);
    if (fieldValues.server) {
        sessionStorage.setItem('dl_server', fieldValues.server);
        sessionStorage.setItem('dl_account', fieldValues.account);
        sessionStorage.setItem('dl_database', fieldValues.database);
    } 
    if (onSuccess) onSuccess({
        user: sessionStorage.getItem('dl_user'),
        server: sessionStorage.getItem('dl_server'),
        account: sessionStorage.getItem('dl_account'),
        database: sessionStorage.getItem('dl_database')
    });
}

Config.resetUser = function(upn) {
    Donkeylift.app.setAccount({user: upn });
    Donkeylift.app.resetSchema({ reload: true });
}

//stackoverflow - https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}