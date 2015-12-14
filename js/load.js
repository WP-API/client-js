/* global WP_API_Settings */
(function( window, undefined ) {

	'use strict';

	window.wp = window.wp || {};
	wp.api = wp.api || {};

	/**
	 * Initialize the wp-api, optionally passing the API root.
	 *
	 * @param {string} apiRoot The api root. Optional, defaults to WP_API_Settings.root.
	 */
	wp.api.init = function( apiRoot, versionString ) {

		wp.api.apiRoot       = apiRoot || WP_API_Settings.root;
		wp.api.versionString = versionString || wp.api.versionString;
		WP_API_Settings.root = wp.api.apiRoot;

		/**
		 * Construct and fetch the API schema.
		 *
		 * Used a session Storage cached version if available.
		 */
		var schemaModel;

		// Used a cached copy of the schema model if available.
		if ( ! _.isUndefined( sessionStorage ) && sessionStorage.getItem( 'wp-api-schema-model' ) ) {

			// Grab the schema model from the sessionStorage cache.
			schemaModel = new wp.api.models.Schema( JSON.parse( sessionStorage.getItem( 'wp-api-schema-model' ) ) );

			// Contruct the models and collections from the Schema model.
			wp.api.constructFromSchema( schemaModel );
		} else {
			// Construct a new Schema model.
			schemaModel = new wp.api.models.Schema(),

			// Fetch the schema information from the API.
			schemaModel.fetch( {
				/**
				 * When the server return the schema model data, store the data in a sessionCache so we don't
				 * have to retrieve it again for this session. Then, construct the models and collections based
				 * on the schema model data.
				 */
				success: function( newSchemaModel ) {
					// Store a copy of the schema model in the session cache if available.
					if ( ! _.isUndefined( sessionStorage ) ) {
						sessionStorage.setItem( 'wp-api-schema-model', JSON.stringify( newSchemaModel ) );
					}
					// Contruct the models and collections from the Schema model.
					wp.api.constructFromSchema( newSchemaModel );
				},
				/**
				 * @todo Handle the error condition.
				 */
				error: function() {
				}
			} );
		}
	};

	/**
	 * Construct the models and collections from the Schema model.
	 *
	 * @param {wp.api.models.Schema} Backbone model of the API schema.
	 */
	wp.api.constructFromSchema = function( model ) {
		/**
		 * Iterate thru the routes, picking up models and collections to build. Builds two arrays,
		 * one for models and one for collections.
		 */
		var modelRoutes = [],
			collectionRoutes = [],
			schemaRoot = wp.api.apiRoot.replace( wp.api.utils.getRootUrl(), '' );

		_.each( model.get( 'routes' ), function( route, index ) {
			// Skip the schema root if included in the schema.
			if ( index !== wp.api.versionString &&
				 index !== schemaRoot &&
				 index !== ( '/' + wp.api.versionString.slice( 0, -1 ) )
			) {
				/**
				 * Single item models end with a regex/variable.
				 *
				 * @todo make model/collection logic more robust.
				 */
				if ( index.endsWith( '+)' ) ) {
					modelRoutes.push( { index: index, route: route } );
				} else {
					// Collections end in a name.
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
				routeName  = wp.api.utils.extractRoutePart( modelRoute.index, 2 ),
				parentName = wp.api.utils.extractRoutePart( modelRoute.index, 4 );

			// If the model has a parent in its route, add that to its class name.
			if ( '' !== parentName && parentName !== routeName ) {
				modelClassName = wp.api.utils.capitalize( parentName ) + wp.api.utils.capitalize( routeName );
				wp.api.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {
					// Function that returns a constructed url based on the parent and id.
					url: function() {
						var url = wp.api.apiRoot + wp.api.versionString +
							parentName +  '/' + this.get( 'parent' ) + '/' +
							routeName;
						if ( ! _.isUndefined( this.get( 'id' ) ) ) {
							url +=  '/' + this.get( 'id' );
						}
						return url;
					},
					// Incldue a refence to the original route object.
					route: modelRoute
				} );
			} else {
				// This is a model without a parent in its route
				modelClassName = wp.api.utils.capitalize( routeName );
				wp.api.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {
					// Function that returns a constructed url based on the id.
					url: function() {
						var url = wp.api.apiRoot + wp.api.versionString + routeName;
						if ( ! _.isUndefined( this.get( 'id' ) ) ) {
							url +=  '/' + this.get( 'id' );
						}
						return url;
					},
					// Incldue a refence to the original route object.
					route: modelRoute
				} );
			}

			// Add defaults to the new model, pulled form the endpoint
			wp.api.decorateFromRoute( modelRoute.route.endpoints, wp.api.models[ modelClassName ] );

			// @todo add
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
				parentName = wp.api.utils.extractRoutePart( collectionRoute.index, 4 );

			// If the collection has a parent in its route, add that to its class name/
			if ( '' !== parentName && parentName !== routeName ) {

				collectionClassName = wp.api.utils.capitalize( parentName ) + wp.api.utils.capitalize( routeName );
				wp.api.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {
					// Function that returns a constructed url pased on the parent.
					url: function() {
						return wp.api.apiRoot + wp.api.versionString +
						parentName + '/' + this.parent + '/' +
						routeName;
					},
					model: wp.api.models[collectionClassName],
					route: collectionRoute
				} );
			} else {
				// This is a collection without a parent in its route.
				collectionClassName = wp.api.utils.capitalize( routeName );
				wp.api.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {
					// For the url of a root level collection, use a string.
					url: wp.api.apiRoot + wp.api.versionString + routeName,
							route: collectionRoute
						} );
			}
			// Add defaults to the new model, pulled form the endpoint
			wp.api.decorateFromRoute( collectionRoute.route.endpoints, wp.api.collections[ collectionClassName ] );
		} );


	};

	/**
	 * Add defaults to a model from a route's endpoints.
	 *
	 * @param {array}  routeEndpoints Array of route endpoints.
	 * @param {Object} modelInstance  An instance of the model (or collection)
	 *                                to add the defaults to.
	 */
	wp.api.decorateFromRoute = function ( routeEndpoints, modelInstance ) {

		/**
		 * Build the defaults based on route endpoint data.
		 */
		_.each( routeEndpoints, function( routeEndpoint ) {
			// Add post and edit endpoints as model defaults.
			if ( _.contains( routeEndpoint.methods, 'POST' ) || _.contains( routeEndpoint.methods, 'PUT' ) ) {

				// Add any non empty args, merging them into the defaults object.
				if ( ! _.isEmpty( routeEndpoint.args ) ) {

					// Set as defauls if no defaults yet.
					if ( _.isEmpty( modelInstance.defaults ) ) {
						modelInstance.defaults = routeEndpoint.args;
					} else {
						// We already have defaults, merge these new args in.
						modelInstance.defaults = _.union( routeEndpoint.args, modelInstance.defaults );
					}
				}
			} else {
				// Add GET method as model options.
				if ( _.contains( routeEndpoint.methods, 'GET' ) ) {
					// Add any non empty args, merging them into the defaults object.
					if ( ! _.isEmpty( routeEndpoint.args ) ) {

						// Set as defauls if no defaults yet.
						if ( _.isEmpty( modelInstance.options ) ) {
							modelInstance.options = routeEndpoint.args;
						} else {
							// We already have options, merge these new args in.
							modelInstance.options = _.union( routeEndpoint.args, modelInstance.options );
						}
					}

				}
			}

		} );

		/**
		 * Finish processing the defaults, assigning `defaults` if available,
		 * otherwise null.
		 *
		 * @todo required arguments
		 *
		 */
		//
		_.each( modelInstance.defaults, function( theDefault, index ) {
			if ( _.isUndefined( theDefault['default'] ) ) {
				modelInstance.defaults[ index ] = null;
			} else {
				modelInstance.defaults[ index ] = theDefault['default'];
			}
		} );
	};

	wp.api.init();

})( window );
