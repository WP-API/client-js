/* global wpApiSettings */
(function( window, undefined ) {

	'use strict';

	var endpointLoading;

	window.wp = window.wp || {};
	wp.api = wp.api || {};

	/**
	 * Initialize the wp-api, optionally passing the API root.
	 *
	 * @param {string} apiRoot The api root. Optional, defaults to wpApiSettings.root.
	 */
	wp.api.init = function( apiRoot, versionString ) {
		var schemaModel,
			apiConstructor;

		wp.api.apiRoot       = apiRoot || wpApiSettings.root;
		wp.api.versionString = versionString || wp.api.versionString;
		wpApiSettings.root = wp.api.apiRoot;

		/**
		 * Construct and fetch the API schema.
		 *
		 * Use a session Storage cached version if available.
		 */
		apiConstructor = new jQuery.Deferred();

		// Used a cached copy of the schema model if available.
		if ( ! _.isUndefined( sessionStorage ) && sessionStorage.getItem( 'wp-api-schema-model' + apiRoot ) ) {

			// Grab the schema model from the sessionStorage cache.
			schemaModel = new wp.api.models.Schema( JSON.parse( sessionStorage.getItem( 'wp-api-schema-model' + apiRoot ) ) );

			// Contruct the models and collections from the Schema model.
			wp.api.constructFromSchema( schemaModel, apiConstructor );
		} else {

			// Construct a new Schema model.
			schemaModel = new wp.api.models.Schema();

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
						sessionStorage.setItem( 'wp-api-schema-model' + apiRoot, JSON.stringify( newSchemaModel ) );
					}

					// Contruct the models and collections from the Schema model.
					wp.api.constructFromSchema( newSchemaModel, apiConstructor );
				},

				// @todo Handle the error condition.
				error: function() {
				}
			} );
		}

		return apiConstructor.promise();

	};

	/**
	 * Construct the models and collections from the Schema model.
	 *
	 * @param {wp.api.models.Schema}    Backbone model of the API schema.
	 * @param {jQuery.Deferred.promise} A promise to send api load updates.
	 */
	wp.api.constructFromSchema = function( model, apiConstructor ) {
		/**
		 * Iterate thru the routes, picking up models and collections to build. Builds two arrays,
		 * one for models and one for collections.
		 */
		var modelRoutes                = [],
			collectionRoutes           = [],
			schemaRoot                 = wp.api.apiRoot.replace( wp.api.utils.getRootUrl(), '' ),
			loadingObjects             = {};

		/**
		 * Tracking objects for models and collections.
		 */
		loadingObjects.models      = {};
		loadingObjects.collections = {};

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
					if ( ! index.endsWith( 'me' ) ) {
						collectionRoutes.push( { index: index, route: route } );
					}
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
				loadingObjects.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {

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
					route: modelRoute,

					// Include the array of route methods for easy reference.
					methods: modelRoute.route.methods
				} );
			} else {

				// This is a model without a parent in its route
				modelClassName = wp.api.utils.capitalize( routeName );
				loadingObjects.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {

					// Function that returns a constructed url based on the id.
					url: function() {
						var url = wp.api.apiRoot + wp.api.versionString + routeName;
						if ( ! _.isUndefined( this.get( 'id' ) ) ) {
							url +=  '/' + this.get( 'id' );
						}
						return url;
					},

					// Incldue a refence to the original route object.
					route: modelRoute,

					// Include the array of route methods for easy reference.
					methods: modelRoute.route.methods
				} );
			}

			// Add defaults to the new model, pulled form the endpoint
			wp.api.decorateFromRoute( modelRoute.route.endpoints, loadingObjects.models[ modelClassName ] );

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
				loadingObjects.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {

					// Function that returns a constructed url pased on the parent.
					url: function() {
						return wp.api.apiRoot + wp.api.versionString +
						parentName + '/' + this.parent + '/' +
						routeName;
					},
					model: loadingObjects.models[collectionClassName],

					// Incldue a refence to the original route object.
					route: collectionRoute,

					// Include the array of route methods for easy reference.
					methods: collectionRoute.route.methods
				} );
			} else {

				// This is a collection without a parent in its route.
				collectionClassName = wp.api.utils.capitalize( routeName );
				loadingObjects.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {

					// For the url of a root level collection, use a string.
					url: wp.api.apiRoot + wp.api.versionString + routeName,

							// Incldue a refence to the original route object.
							route: collectionRoute,

							// Include the array of route methods for easy reference.
							methods: collectionRoute.route.methods
						} );
			}

			// Add defaults to the new model, pulled form the endpoint
			wp.api.decorateFromRoute( collectionRoute.route.endpoints, loadingObjects.collections[ collectionClassName ] );
		} );

		_.defer( function() {
			apiConstructor.resolve( loadingObjects );
		} );
	};

	/**
	 * Add defaults to a model from a route's endpoints.
	 *
	 * @param {array}  routeEndpoints Array of route endpoints.
	 * @param {Object} modelInstance  An instance of the model (or collection)
	 *                                to add the defaults to.
	 */
	wp.api.decorateFromRoute = function( routeEndpoints, modelInstance ) {

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
		 * Finish processing the defaults, assigning `defaults` if available, otherwise null.
		 *
		 * @todo required arguments
		 */
		_.each( modelInstance.defaults, function( theDefault, index ) {
			if ( _.isUndefined( theDefault['default'] ) ) {
				modelInstance.defaults[ index ] = null;
			} else {
				modelInstance.defaults[ index ] = theDefault['default'];
			}
		} );
	};

	/**
	 * Construct the default endpoints and add to an endpoints collection.
	 */
	wp.api.endpoints = new Backbone.Collection();

	// The wp.api.init function returns a promise that will resolve with the endpoint once it is ready.
	endpointLoading = wp.api.init();

	// When the endpoint is loaded, complete the setup process.
	endpointLoading.done( function( endpoint ) {

		// Map the default endpoints, extending any already present items (including Schema model).
		wp.api.models      = _.extend( endpoint.models, wp.api.models );
		wp.api.collections = _.extend( endpoint.collections, wp.api.collections );

		// Add the endpoint to the endpoints collection.
		wp.api.endpoints.push( endpoint );
	} );

})( window );
