/* global wpApiSettings */
(function( window, undefined ) {

	'use strict';

	var Endpoint, initializedDeferreds = {};

	window.wp = window.wp || {};
	wp.api = wp.api || {};

	Endpoint = Backbone.Model.extend({
		defaults: {
			apiRoot: wpApiSettings.root,
			versionString: wp.api.versionString,
			schema: null,
			models: {},
			collections: {}
		},

		initialize: function() {
			var model = this, deferred;

			Backbone.Model.prototype.initialize.apply( model, arguments );

			deferred = jQuery.Deferred();
			model.schemaConstructed = deferred.promise();

			model.schemaModel = new wp.api.models.Schema( null, {
				apiRoot: model.get( 'apiRoot' ),
				versionString: model.get( 'versionString' )
			});

			model.schemaModel.once( 'change', function() {
				model.constructFromSchema();
				deferred.resolve( model );
			} );

			if ( model.get( 'schema' ) ) {

				// Use schema supplied as model attribute.
				model.schemaModel.set( model.schemaModel.parse( model.get( 'schema' ) ) );
			} else if ( ! _.isUndefined( sessionStorage ) && sessionStorage.getItem( 'wp-api-schema-model' + model.get( 'apiRoot' ) + model.get( 'versionString' ) ) ) {

				// Used a cached copy of the schema model if available.
				model.schemaModel.set( model.schemaModel.parse( JSON.parse( sessionStorage.getItem( 'wp-api-schema-model' + model.get( 'apiRoot' ) + model.get( 'versionString' ) ) ) ) );
			} else {
				model.schemaModel.fetch({
					/**
					 * When the server return the schema model data, store the data in a sessionCache so we don't
					 * have to retrieve it again for this session. Then, construct the models and collections based
					 * on the schema model data.
					 */
					success: function( newSchemaModel ) {

						// Store a copy of the schema model in the session cache if available.
						if ( ! _.isUndefined( sessionStorage ) ) {
							sessionStorage.setItem( 'wp-api-schema-model' + model.get( 'apiRoot' ) + model.get( 'versionString' ), JSON.stringify( newSchemaModel ) );
						}
					},

					// @todo Handle the error condition.
					error: function() {
					}
				});
			}
		},

		constructFromSchema: function() {
			var routeModel = this, modelRoutes, collectionRoutes, schemaRoot, loadingObjects;

			/**
			 * Iterate thru the routes, picking up models and collections to build. Builds two arrays,
			 * one for models and one for collections.
			 */
			modelRoutes                = [];
			collectionRoutes           = [];
			schemaRoot                 = routeModel.get( 'apiRoot' ).replace( wp.api.utils.getRootUrl(), '' );
			loadingObjects             = {};

			/**
			 * Tracking objects for models and collections.
			 */
			loadingObjects.models      = routeModel.get( 'models' );
			loadingObjects.collections = routeModel.get( 'collections' );

			_.each( routeModel.schemaModel.get( 'routes' ), function( route, index ) {

				// Skip the schema root if included in the schema.
				if ( index !== routeModel.get( ' versionString' ) &&
						index !== schemaRoot &&
						index !== ( '/' + routeModel.get( 'versionString' ).slice( 0, -1 ) )
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
							var url = routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) +
									parentName +  '/' + this.get( 'parent' ) + '/' +
									routeName;
							if ( ! _.isUndefined( this.get( 'id' ) ) ) {
								url +=  '/' + this.get( 'id' );
							}
							return url;
						},

						// Include a reference to the original route object.
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
							var url = routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) + routeName;
							if ( ! _.isUndefined( this.get( 'id' ) ) ) {
								url +=  '/' + this.get( 'id' );
							}
							return url;
						},

						// Include a reference to the original route object.
						route: modelRoute,

						// Include the array of route methods for easy reference.
						methods: modelRoute.route.methods
					} );
				}

				// Add defaults to the new model, pulled form the endpoint
				wp.api.decorateFromRoute( modelRoute.route.endpoints, loadingObjects.models[ modelClassName ] );

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

						// Function that returns a constructed url passed on the parent.
						url: function() {
							return routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) +
									parentName + '/' + this.parent + '/' +
									routeName;
						},

						// Specify the model that this collection contains.
						model: loadingObjects.models[ collectionClassName ],

						// Include a reference to the original route object.
						route: collectionRoute,

						// Include the array of route methods for easy reference.
						methods: collectionRoute.route.methods
					} );
				} else {

					// This is a collection without a parent in its route.
					collectionClassName = wp.api.utils.capitalize( routeName );
					loadingObjects.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {

						// For the url of a root level collection, use a string.
						url: routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) + routeName,

						// Specify the model that this collection contains.
						model: loadingObjects.models[ collectionClassName ],

						// Include a reference to the original route object.
						route: collectionRoute,

						// Include the array of route methods for easy reference.
						methods: collectionRoute.route.methods
					} );
				}

				// Add defaults to the new model, pulled form the endpoint
				wp.api.decorateFromRoute( collectionRoute.route.endpoints, loadingObjects.collections[ collectionClassName ] );
			} );
		}

	});

	wp.api.endpoints = new Backbone.Collection({
		model: Endpoint
	});

	/**
	 * Initialize the wp-api, optionally passing the API root.
	 *
	 * @param {object} [args]
	 * @param {string} [args.apiRoot] The api root. Optional, defaults to wpApiSettings.root.
	 * @param {string} [args.versionString] The version string. Optional, defaults to wpApiSettings.root.
	 * @param {object} [args.schema] The schema. Optional, will be fetched from API if not provided.
	 */
	wp.api.init = function( args ) {
		var endpoint, attributes = {}, deferred, promise;

		args = args || {};
		attributes.apiRoot = args.apiRoot || wpApiSettings.root;
		attributes.versionString = args.versionString || wpApiSettings.versionString;
		attributes.schema = args.schema || null;
		if ( ! attributes.schema && attributes.apiRoot === wpApiSettings.root && attributes.versionString === wpApiSettings.versionString ) {
			attributes.schema = wpApiSettings.schema;
		}

		if ( ! initializedDeferreds[ attributes.apiRoot + attributes.versionString ] ) {
			endpoint = wp.api.endpoints.findWhere( { apiRoot: attributes.apiRoot, versionString: attributes.versionString } );
			if ( ! endpoint ) {
				endpoint = new Endpoint( attributes );
				wp.api.endpoints.add( endpoint );
			}
			deferred = jQuery.Deferred();
			promise = deferred.promise();

			endpoint.schemaConstructed.done( function( endpoint ) {

				// Map the default endpoints, extending any already present items (including Schema model).
				wp.api.models      = _.extend( endpoint.get( 'models' ), wp.api.models );
				wp.api.collections = _.extend( endpoint.get( 'collections' ), wp.api.collections );
				deferred.resolveWith( wp.api, [ endpoint ] );
			} );
			initializedDeferreds[ attributes.apiRoot + attributes.versionString ] = promise;
		}
		return initializedDeferreds[ attributes.apiRoot + attributes.versionString ];
	};

	/**
	 * Add mixins and helpers to models depending on their defaults.
	 *
	 * @param {Backbone Model} model The model to attach helpers and mixins to.
	 */
	wp.api.addMixinsAndHelpers = function( model ) {

		var hasDate = false,

			/**
			 * Array of parseable dates.
			 *
			 * @type {string[]}.
			 */
			parseableDates = [ 'date', 'modified', 'date_gmt', 'modified_gmt' ],

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
					var user, authorId, embeddeds, attributes;

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

					// Return the constructed user.
					return user;
				}
			};

		// Exit if we don't have valid model defaults.
		if ( _.isUndefined( model.defaults ) ) {
			return model;
		}

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
			if ( null === theDefault || _.isUndefined( theDefault['default'] ) ) {
				modelInstance.defaults[ index ] = null;
			} else {
				modelInstance.defaults[ index ] = theDefault['default'];
			}
		} );
	};

	/**
	 * Construct the default endpoints and add to an endpoints collection.
	 */

	// The wp.api.init function returns a promise that will resolve with the endpoint once it is ready.
	wp.api.init();

})( window );
