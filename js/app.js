(function( window, undefined ) {

	'use strict';

	/**
	 * Initialise the WP_API.
	 */
	function WP_API() {
		this.models = {};
		this.collections = {};
		this.views = {};
	}

	window.wp            = window.wp || {};
	wp.api               = wp.api || new WP_API();
	wp.api.versionString = wp.api.versionString || 'wp/v2/';

	// Alias _includes to _.contains, ensuring it is available if lodash is used.
	if ( ! _.isFunction( _.includes ) && _.isFunction( _.contains ) ) {
	  _.includes = _.contains;
	}

})( window );
