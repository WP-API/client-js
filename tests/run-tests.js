/* global console, wpApiSettings:false */
// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, wpApiSettings, window, undefined ) {
	/**
	 * Test the endpoints.
	 *
	 * @todo add an assertion library.
	 */
	jQuery( document ).ready( function() {
		console.log( 'Running tests.' );
		/**
		 * Post
		 */
		var postTests = function() {
			console.log( 'running postTests' );
			// Create a post.
			console.log( 'Create a post using wp.api.models.Post' );
			var post = new wp.api.models.Posts();
			var data = {
					title: 'This is a test post'
				};

			var success = function( response ) {
				// Created the post.
				console.log ( 'Created post ID: ' + response.id );

				// Try Fetching
				console.log( 'Fetching a post using wp.api.models.Post' );
				data = {
					id: response.id
				};

				var post2 = new wp.api.models.Posts( data );
				post2.fetch( {
					success: function( model, response ) {

						// Fetch success.
						console.log ( 'Read post ID: ' + post2.get( 'id' ) );

						// Try deleting.
						console.log ( 'Deleting post ID: ' + post2.get( 'id' ) );
						post2.destroy( {
							success: function( model, response ) {
								// Delete success.
								console.log ( 'Deleted ' + model.get( 'id' ) );

								// Check status, verify trashed.
								data = {
										id:          response.id,
										post_status: 'trashed'
									};
								var post3 = new wp.api.models.Post( data );
								post3.fetch( {
									success: function( model, response, options ) {
										console.log ( 'Re-read post, status is: ' + model.get( 'post_status' ) );

										// @todo Contunue tests.

									}
								} );
							}
						} );

					}
				} );



			};

			post.save( data, { success: success } );
		};
		postTests();

	} );
})( wp, wpApiSettings, window );
