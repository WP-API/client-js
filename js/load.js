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
		var modelRoutes      = [],
			collectionRoutes = [],
			schemaRoot       = wp.api.apiRoot.replace( wp.api.utils.getRootUrl(), '' ),
			loadingObjects   = {};

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
			wp.api.addDefaultsandOptionsFromSchema( modelRoute.route.endpoints, loadingObjects.models[ modelClassName ] );

			// Add mixins and helpers for the model.
			loadingObjects.models[ modelClassName ] = wp.api.addMixinsAndHelpers( loadingObjects.models[ modelClassName ] );

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

			// Add defaults to the new collection, pulled from the endpoint.
			wp.api.addDefaultsandOptionsFromSchema( collectionRoute.route.endpoints, loadingObjects.collections[ collectionClassName ] );
		} );

		_.defer( function() {
			apiConstructor.resolve( loadingObjects );
		} );
	};

	/**
	 * Add mixins and helpers to models depending on their defaults.
	 *
	 * @param {Backbone Model} model The model to attach helpers and mixins to.
	 */
	wp.api.addMixinsAndHelpers = function( model ) {

		var hasDate = false;

		// Exit if we don't have valid model defaults.
		if ( _.isUndefined( model.defaults ) ) {
			return;
		}

		/**
		 * Array of parseable dates.
		 *
		 * @type {string[]}.
		 */
		var parseableDates = [ 'date', 'modified', 'date_gmt', 'modified_gmt' ],

		/**
		 * Mixin for all content that is time stamped.
		 *
		 * This mixin converts between mysql timestamps and JavaScript Dates when syncing a model
		 * to or from the server. For example, a date stored as `2015-12-27T21:22:24` on the server
		 * gets expanded to `Sun Dec 27 2015 14:22:24 GMT-0700 (MST)` when the model is fetched.
		 *
		 * @type {{toJSON: toJSON, parse: parse}}.
		 */
		TimeStampedMixin = {
			/**
			 * Serialize the entity pre-sync.
			 *
			 * @returns {*}.
			 */
			toJSON: function() {
				var attributes = _.clone( this.attributes );

				// Serialize Date objects back into 8601 strings.
				_.each( parseableDates, function( key ) {
					if ( key in attributes ) {
						attributes[ key ] = attributes[ key ].toISOString();
					}
				} );

				return attributes;
			},

			/**
			 * Unserialize the fetched response.
			 *
			 * @param {*} response.
			 * @returns {*}.
			 */
			parse: function( response ) {
				var timestamp;

				// Parse dates into native Date objects.
				_.each( parseableDates, function( key ) {
					if ( ! ( key in response ) ) {
						return;
					}

					timestamp = wp.api.utils.parseISO8601( response[ key ] );
					response[ key ] = new Date( timestamp );
				});

				return response;
			}
		},

		/**
		 * The author mixin adds a helper funtion to retrieve a models author user model.
		 */
		AuthorMixin = {

			/**
			 * Get a user model for an model's author.
			 *
			 * Uses the embedded user data if available, otherwises fetches the user
			 * data from the server.
			 *
			 * @return {Object} user A backbone model representing the author user.
			 */
			getAuthorUser: function() {
				var user, authorId, embeddeds, attributes,

					// @todo skip saving this field when saving post.
					authorUser = this.get( 'authorUser' );

				// Do we already have a stored user
				if ( authorUser ) {
					return authorUser;
				}

				authorId  = this.get( 'author' );
				embeddeds = this.get( '_embedded' ) || {};

				// Verify that we have a valied autor id.
				if ( ! _.isNumber( authorId ) ) {
					return null;
				}

				// If we have embedded author data, use that when constructing the user.
				if ( embeddeds.author ) {
					attributes = _.findWhere( embeddeds.author, { id: authorId } );
				}

				// Otherwise use the authorId.
				if ( ! attributes ) {
					attributes = { id: authorId };
				}

				// Create the new user model.
				user = new wp.api.models.Users( attributes );

				// If we didn’t have an embedded user, fetch the user data.
				if ( ! user.get( 'name' ) ) {
					user.fetch();
				}

				// Save the user to the model.
				this.set( 'authorUser', user );

				// Return the constructed user.
				return user;
			}
		};

		// Go thru the parsable date fields, if our model contains any of them it gets the TimeStampedMixin.
		_.each( parseableDates, function( theDateKey ) {
			if ( ! _.isUndefined( model.defaults[ theDateKey ] ) ) {
				hasDate = true;
			}
		} );

		// Add the TimeStampedMixin for models that contain a date field.
		if ( hasDate ) {
			model = model.extend( TimeStampedMixin );
		}

		// Add the AuthorMixin for models that contain an author.
		if ( ! _.isUndefined( model.defaults.author ) ) {
			model = model.extend( AuthorMixin );
		}

		return model;
	};



	/**
	 * Add defaults and options to a model or collection from a route's endpoints.
	 *
	 * @param {array}  routeEndpoints Array of route endpoints.
	 * @param {Object} modelOrCollectionInstance  An instance of the model (or collection)
	 *                                to add the defaults to.
	 */
	wp.api.addDefaultsandOptionsFromSchema = function( routeEndpoints, modelOrCollectionInstance ) {

		/**
		 * Build the defaults based on route endpoint data.
		 */
		_.each( routeEndpoints, function( routeEndpoint ) {

			// Add post and edit endpoints as model defaults.
			if ( _.contains( routeEndpoint.methods, 'POST' ) || _.contains( routeEndpoint.methods, 'PUT' ) ) {

				// Add any non empty args, merging them into the defaults object.
				if ( ! _.isEmpty( routeEndpoint.args ) ) {

					// Set as defauls if no defaults yet.
					if ( _.isEmpty( modelOrCollectionInstance.defaults ) ) {
						modelOrCollectionInstance.defaults = routeEndpoint.args;
					} else {

						// We already have defaults, merge these new args in.
						modelOrCollectionInstance.defaults = _.union( routeEndpoint.args, modelOrCollectionInstance.defaults );
					}
				}
			} else {

				// Add GET method as model options.
				if ( _.contains( routeEndpoint.methods, 'GET' ) ) {

					// Add any non empty args, merging them into the defaults object.
					if ( ! _.isEmpty( routeEndpoint.args ) ) {

						// Set as defauls if no defaults yet.
						if ( _.isEmpty( modelOrCollectionInstance.options ) ) {
							modelOrCollectionInstance.options = routeEndpoint.args;
						} else {

							// We already have options, merge these new args in.
							modelOrCollectionInstance.options = _.union( routeEndpoint.args, modelOrCollectionInstance.options );
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
		_.each( modelOrCollectionInstance.defaults, function( theDefault, index ) {
			if ( _.isUndefined( theDefault['default'] ) ) {
				modelOrCollectionInstance.defaults[ index ] = null;
			} else {
				modelOrCollectionInstance.defaults[ index ] = theDefault['default'];
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
