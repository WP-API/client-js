/* global WP_API_Settings */
(function( window, undefined ) {

	'use strict';

	/**
	 * Initialize the wp-api, optionally passing the API root.
	 *
	 * @param {string} apiRoot The api root. Optional, defaults to WP_API_Settings.root.
	 */
	wp.api.init = function( apiRoot, versionString ) {

		apiRoot       = apiRoot || WP_API_Settings.root;
		versionString = versionString || 'wp/v2/';

		/**
		 * Construct and fetch the API schema.
		 */
		var schema = new wp.api.models.Schema(),
			schemaRoot = apiRoot.replace( wp.api.utils.getRootUrl(), '' );

		schema.fetch( {
			success: function( model ) {
				/**
				 * Iterate thru the routes, picking up models and collections to build. Builds two arrays,
				 * one for models and one for collections.
				 */
				var modelRoutes = [], collectionRoutes = [];
				_.each( model.get( 'routes' ), function( route, index ) {
					// Skip the schema root if included in the schema
					if ( index !== versionString && index !== schemaRoot && index !== ( '/' + versionString.slice( 0, -1 ) ) ) {
						// Single item models end with an id or slug
						if ( index.endsWith( '+)' ) ) {
							modelRoutes.push( { index: index, route: route } );
						} else {
							// Collections contain a number or slug inside their route
							collectionRoutes.push( { index: index, route: route } );
						}
					}
				} );

				/**
				 * Construct the models.
				 *
				 * Base the class name on the route endpoint.
				 */
				_.each( modelRoutes, function( modelRoute ) {

					// Extract the name and any parent from the route.
					var modelClassName,
						routeName  = wp.api.utils.extractRouteName( modelRoute.index ),
						parentName = wp.api.utils.extractParentName( modelRoute.index );

					// If the model has a parent in its route, add that to its class name.
					if ( '' !== parentName && parentName !== routeName ) {
						modelClassName = parentName.wpapiCapitalize() + routeName.wpapiCapitalize();
						wp.api.models[modelClassName] = wp.api.WPApiBaseModel.extend( {
							// Function that returns a constructed url based on the parent and id.
							url: function() {
								return apiRoot + versionString +
									parentName +  '/' + this.get( 'parent' ) + '/' +
									routeName  +  '/' + this.get( 'id' );
							},
							// Incldue a refence to the original route object.
							route: modelRoute
						} );
					} else {
						// This is a model without a parent in its route
						modelClassName = routeName.wpapiCapitalize();
						wp.api.models[modelClassName] = wp.api.WPApiBaseModel.extend( {
							// Function that returns a constructed url based on the id.
							url: function() {
								return apiRoot + versionString + routeName +  '/' + this.get( 'id' );
							},
							// Incldue a refence to the original route object.
							route: modelRoute
						} );
					}
				} );

				/**
				 * Construct the collections.
				 *
				 * Base the class name on the route endpoint.
				 */
				_.each( collectionRoutes, function( collectionRoute ) {

					// Extract the name and any parent from the route.
					var collectionClassName,
						routeName  = collectionRoute.index.slice( collectionRoute.index.lastIndexOf( '/' ) + 1 ),
						parentName = wp.api.utils.extractParentName( collectionRoute.index );

					// If the collection has a parent in its route, add that to its class name/
					if ( '' !== parentName && parentName !== routeName ) {

						collectionClassName = parentName.wpapiCapitalize() + routeName.wpapiCapitalize();
						wp.api.collections[collectionClassName] = wp.api.WPApiBaseCollection.extend( {
							// Function that returns a constructed url pased on the parent.
							url: function() {
								return apiRoot + versionString +
								parentName + '/' + this.parent + '/' +
								routeName;
							},
							model: wp.api.models[collectionClassName],
							route: collectionRoute
						} );
					} else {
						// This is a collection without a parent in its route.
						collectionClassName = routeName.wpapiCapitalize();
						wp.api.collections[collectionClassName] = wp.api.WPApiBaseCollection.extend( {
							// For the url of a root level collection, use a string.
							url: apiRoot + versionString + routeName,
									route: collectionRoute
								} );
					}
				} );
			},
			error: function() {
			}
		} );

	};

	wp.api.init();

})( window );
