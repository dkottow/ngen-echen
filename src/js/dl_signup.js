/*global $ */

var signupAction = '$DONKEYLIFT_API/public/signup';

function addEventHandlers() {

	$.ajaxPrefilter(function( options, _, jqXHR ) {
		$('#ajax-progress-spinner').show();
	    jqXHR.always(function() {
			$('#ajax-progress-spinner').hide();
		});
	});

	$('#email').change(function() {
		var accountName = $('#email').val()
			.substr(0, $('#email').val().indexOf('@'))
			.replace(/[^a-zA-Z0-9]/g, '_');
		$('#account').val(accountName);
	});

	$('form').attr('action', signupAction);
	$('form').submit(function(e) {
		//client side validation..

		$('.help-block').text('');
		$('form div').removeClass('has-error');

		//post to server
		 $.ajax({
			url: $(this).attr('action'),
			type: $(this).attr('method'),
			data: $(this).serialize()
		})
		.done(function(data, textStatus, jqxhr) {
			var msg = 'User ' + data.email 
+ ' created and linked to Account ' + data.account;
			$('#form-signup').html(msg);
		})
		.fail(function(jqxhr, textStatus, errorThrown) {

			var err = jqxhr.responseJSON.error;
			var elem = jqxhr.responseJSON.arg;
			if (elem) {
				$('#help-' + elem).text(err);
				$('#' + elem).closest('div').addClass('has-error');
			} else {
				$('#general-error-message').text("Error: " + err);
			}
		})
		e.preventDefault();
	});
}
