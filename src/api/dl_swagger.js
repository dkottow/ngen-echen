/* global $, Auth0Lock */
window.doCustomInit = function() {
    console.log("DL - add example values to path params.");
    $('input[name="account"]').attr('value','demo');
    $('input[name="database"]').attr('value','sandwiches');
    $('input[name="table"]').attr('value','customers');


    $('#login').click(function() {
    	
	    var lock = new Auth0Lock('$AUTH0_CLIENT_ID', '$AUTH0_DOMAIN');
		
		var opts = {
			signupLink: '/public/signup.html'
			, authParams: { scope: 'openid email app_metadata' } 
		};
	
		lock.show(opts, function(err, profile, id_token) {
			if (err) {
				console.log("There was an error :/", err);
				return;
		  	}
		  	$('#input_apiKey').val(id_token);
		  	$('#input_apiKey').change();
			sessionStorage.setItem('id_token', id_token);
		  	//console.log(id_token);
		});
		
    });

    
}