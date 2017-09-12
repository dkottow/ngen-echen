/* global jQuery, $, Auth0Lock */
window.doCustomInit = function() {
    console.log("DL - add example values to path params.");
    $('input[name="account"]').val('demo');
    $('input[name="database"]').val('sandwiches');
    $('input[name="table"]').val('customers');

	var example_fields = ['orders.order_date', 'orders.total_amount', 'customers.name', 'sandwiches.name', 'sandwiches.price'];
	var example_filters = ["orders.order_date btwn '2015-01-01', '2015-12-31'", "sandwiches.origin eq 'Chile'"];

	jQuery.each(['#table_getRows_content', '#table_getObjs_content'], function(i, div_id) {
		$(div_id + ' textarea[name="$filter"]').val(example_filters.join('\n'));
		$(div_id + ' textarea[name="$select"]').val(example_fields.join('\n'));
	})

	$('#table_getRows_content input[name="table"]').val('orders');
	$('#table_getRows_content textarea[name="$orderby"]').val(['orders.order_date', 'sandwiches.name'].join('\n'));

	$('#table_getObjs_content input[name="table"]').val('sandwiches');

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