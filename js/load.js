( function() {

	'use strict';

	var Endpoint, initializedDeferreds = {},
		wpApiSettings = window.wpApiSettings || {};
	window.wp = window.wp || {};
	wp.api    = wp.api || {};

	// If wpApiSettings is unavailable, try the default.
	if ( _.isEmpty( wpApiSettings ) ) {
		wpApiSettings.root = window.location.origin + '/wp-json/';
	}

	Endpoint = Backbone.Model.extend( {
		defaults: {
			apiRoot: wpApiSettings.root,
			versionString: wp.api.versionString,
			schema: null,
			models: {},
			collections: {}
		},

		/**
		 * Initialize the Endpoint model.
		 */
		initialize: function() {
			var model = this, deferred, oauth, requestData, token;

				wp.api.oauth.setup = function( clientKey, secretKey, requestUrl ) {

				// Are we using OAuth 1 and don't already have a token in the response
				if ( wpApiSettings.oauth1 && _.isNull( wpApiSettings.oauth1Token ) ) {
					oauth = new OAuth( {
						consumer: {
							'public': clientKey,
							'secret': secretKey
						},
						signature_method: 'HMAC-SHA1'

					} );
					requestData = {
						url: requestUrl,
						method: 'POST',
						data: {
							oauth_callback: window.location.toString().replace( location.search, '' )
						}
					};

					// Request the authorization tokens.
					jQuery.ajax( {
						url: requestData.url,
						type: requestData.method,

						// Add the authorization headers.
						beforeSend: function( xhr ) {
							var oauthHeaders = oauth.toHeader( oauth.authorize( requestData, token ) );
							_.each( oauthHeaders, function( header, index ) {
								xhr.setRequestHeader( index, header );
							} );
						}
					} ).done( function( tokens ) {

						token = wp.api.utils.extractTokens( tokens, true );

						// Store the returned token data into the session.
						sessionStorage.setItem( 'tokenPublic', JSON.stringify( token['public'] ) );
						sessionStorage.setItem( 'tokenSecret', JSON.stringify( token.secret ) );

						window.location.href = wpApiSettings.oauth1.authorize +  '?oauth_token=' + token['public'];

					} );
				}
			};

			// Set up OAuth, using localized or passed credentials.
			wp.api.oauth.connect = function( clientKey, secretKey ) {
				var secretKey = secretKey || wpApiSettings.oauth1Secret,
					clientKey = clientKey || wpApiSettings.oauth1Public;

				if ( ! localStorage.getItem( 'wpOathToken' ) ) {

					// Setup the oath process.
					wp.api.oauth.setup( clientKey, secretKey, wpApiSettings.oauth1.request );
				}
			};

			// NEXT STEP: Handle the returned temporary OAuth token, requesting a long term token.
			if ( ( ! _.isNull( wpApiSettings.oauth1Token ) && ( ! localStorage.getItem( 'wpOathToken' ) ) ) ) {

				// Construct a new request to get a long term authorization token.
				token = {
					'public': JSON.parse( sessionStorage.getItem( 'tokenPublic' ) ),
					'secret': JSON.parse( sessionStorage.getItem( 'tokenSecret' ) )
				};
				oauth = new OAuth( {
					consumer: {
						'public': wpApiSettings.oauth1Public,
						'secret': wpApiSettings.oauth1Secret
					},
					signature_method: 'HMAC-SHA1'

				} );
				requestData = {
					url: wpApiSettings.oauth1.access,
					method: 'POST',
					data: {
						oauth_callback: window.location.toString().replace( location.search, '' ),
						oauth_verifier: wpApiSettings.oauth1Verifier,
						oauth_token:    wpApiSettings.oauth1Token
					}
				};
				jQuery.ajax( {
					url: requestData.url,
					type: requestData.method,

					// Add the authorization headers.
					beforeSend: function( xhr ) {
						var oauthHeaders = oauth.toHeader( oauth.authorize( requestData, token ) );
						_.each( oauthHeaders, function( header, index ) {
							xhr.setRequestHeader( index, header );
						} );
					}
				} ).success( function( tokens ) {

					// We have a valid token, store it in localStorage.
					token = wp.api.utils.extractTokens( tokens, false );
					localStorage.setItem( 'wpOathToken', JSON.stringify( token ) );

				} );

			}

			Backbone.Model.prototype.initialize.apply( model, arguments );

			deferred = jQuery.Deferred();
			model.schemaConstructed = deferred.promise();

			model.schemaModel = new wp.api.models.Schema( null, {
				apiRoot: model.get( 'apiRoot' ),
				versionString: model.get( 'versionString' )
			} );

			// When the model loads, resolve the promise.
			model.schemaModel.once( 'change', function() {
				model.constructFromSchema();
				deferred.resolve( model );
			} );

			if ( model.get( 'schema' ) ) {

				// Use schema supplied as model attribute.
				model.schemaModel.set( model.schemaModel.parse( model.get( 'schema' ) ) );
			} else if (
				! _.isUndefined( sessionStorage ) &&
				( _.isUndefined( wpApiSettings.cacheSchema ) || wpApiSettings.cacheSchema ) &&
				sessionStorage.getItem( 'wp-api-schema-model' + model.get( 'apiRoot' ) + model.get( 'versionString' ) )
			) {

				// Used a cached copy of the schema model if available.
				model.schemaModel.set( model.schemaModel.parse( JSON.parse( sessionStorage.getItem( 'wp-api-schema-model' + model.get( 'apiRoot' ) + model.get( 'versionString' ) ) ) ) );
			} else {
				model.schemaModel.fetch( {
					/**
					 * When the server returns the schema model data, store the data in a sessionCache so we don't
					 * have to retrieve it again for this session. Then, construct the models and collections based
					 * on the schema model data.
					 */
					success: function( newSchemaModel ) {

						// Store a copy of the schema model in the session cache if available.
						if ( ! _.isUndefined( sessionStorage ) && ( _.isUndefined( wpApiSettings.cacheSchema ) || wpApiSettings.cacheSchema ) ) {
							try {
								sessionStorage.setItem( 'wp-api-schema-model' + model.get( 'apiRoot' ) + model.get( 'versionString' ), JSON.stringify( newSchemaModel ) );
							} catch ( error ) {

								// Fail silently, fixes errors in safari private mode.
							}
						}
					},

					// Log the error condition.
					error: function( err ) {
						window.console.log( err );
					}
				} );
			}
		},

		constructFromSchema: function() {
			var routeModel = this, modelRoutes, collectionRoutes, schemaRoot, loadingObjects,

			/**
			 * Set up the model and collection name mapping options. As the schema is built, the
			 * model and collection names will be adjusted if they are found in the mapping object.
			 *
			 * Localizing a variable wpApiSettings.mapping will over-ride the default mapping options.
			 *
			 */
			mapping = wpApiSettings.mapping || {
				models: {
					'Categories':      'Category',
					'Comments':        'Comment',
					'Pages':           'Page',
					'PagesMeta':       'PageMeta',
					'PagesRevisions':  'PageRevision',
					'Posts':           'Post',
					'PostsCategories': 'PostCategory',
					'PostsRevisions':  'PostRevision',
					'PostsTags':       'PostTag',
					'Schema':          'Schema',
					'Statuses':        'Status',
					'Tags':            'Tag',
					'Taxonomies':      'Taxonomy',
					'Types':           'Type',
					'Users':           'User'
				},
				collections: {
					'PagesMeta':       'PageMeta',
					'PagesRevisions':  'PageRevisions',
					'PostsCategories': 'PostCategories',
					'PostsMeta':       'PostMeta',
					'PostsRevisions':  'PostRevisions',
					'PostsTags':       'PostTags'
				}
			};

			/**
			 * Iterate thru the routes, picking up models and collections to build. Builds two arrays,
			 * one for models and one for collections.
			 */
			modelRoutes      = [];
			collectionRoutes = [];
			schemaRoot       = routeModel.get( 'apiRoot' ).replace( wp.api.utils.getRootUrl(), '' );
			loadingObjects   = {};

			/**
			 * Tracking objects for models and collections.
			 */
			loadingObjects.models      = {};
			loadingObjects.collections = {};

			_.each( routeModel.schemaModel.get( 'routes' ), function( route, index ) {

				// Skip the schema root if included in the schema.
				if ( index !== routeModel.get( ' versionString' ) &&
						index !== schemaRoot &&
						index !== ( '/' + routeModel.get( 'versionString' ).slice( 0, -1 ) )
				) {

					// Single items end with a regex (or the special case 'me').
					if ( /(?:.*[+)]|\/me)$/.test( index ) ) {
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
					routeName  = wp.api.utils.extractRoutePart( modelRoute.index, 2, routeModel.get( 'versionString' ), true ),
					parentName = wp.api.utils.extractRoutePart( modelRoute.index, 1, routeModel.get( 'versionString' ), false ),
					routeEnd   = wp.api.utils.extractRoutePart( modelRoute.index, 1, routeModel.get( 'versionString' ), true );

				// Clear the parent part of the rouite if its actually the version string.
				if ( parentName === routeModel.get( 'versionString' ) ) {
					parentName = '';
				}

				// Handle the special case of the 'me' route.
				if ( 'me' === routeEnd ) {
					routeName = 'me';
				}

				// If the model has a parent in its route, add that to its class name.
				if ( '' !== parentName && parentName !== routeName ) {
					modelClassName = wp.api.utils.capitalizeAndCamelCaseDashes( parentName ) + wp.api.utils.capitalizeAndCamelCaseDashes( routeName );
					modelClassName = mapping.models[ modelClassName ] || modelClassName;
					loadingObjects.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {

						// Return a constructed url based on the parent and id.
						url: function() {
							var url =
								routeModel.get( 'apiRoot' ) +
								routeModel.get( 'versionString' ) +
								parentName +  '/' +
									( ( _.isUndefined( this.get( 'parent' ) ) || 0 === this.get( 'parent' ) ) ?
										( _.isUndefined( this.get( 'parent_post' ) ) ? '' : this.get( 'parent_post' ) + '/' ) :
										this.get( 'parent' ) + '/' ) +
								routeName;

							if ( ! _.isUndefined( this.get( 'id' ) ) ) {
								url +=  '/' + this.get( 'id' );
							}
							return url;
						},

						// Include a reference to the original route object.
						route: modelRoute,

						// Include a reference to the original class name.
						name: modelClassName,

						// Include the array of route methods for easy reference.
						methods: modelRoute.route.methods,

						initialize: function( attributes, options ) {
							wp.api.WPApiBaseModel.prototype.initialize.call( this, attributes, options );

							/**
							 * Posts and pages support trashing, other types don't support a trash
							 * and require that you pass ?force=true to actually delete them.
							 *
							 * @todo we should be getting trashability from the Schema, not hard coding types here.
							 */
							if (
								'Posts' !== this.name &&
								'Pages' !== this.name &&
								_.includes( this.methods, 'DELETE' )
							) {
								this.requireForceForDelete = true;
							}
						}
					} );
				} else {

					// This is a model without a parent in its route
					modelClassName = wp.api.utils.capitalizeAndCamelCaseDashes( routeName );
					modelClassName = mapping.models[ modelClassName ] || modelClassName;
					loadingObjects.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {

						// Function that returns a constructed url based on the id.
						url: function() {
							var url = routeModel.get( 'apiRoot' ) +
								routeModel.get( 'versionString' ) +
								( ( 'me' === routeName ) ? 'users/me' : routeName );

							if ( ! _.isUndefined( this.get( 'id' ) ) ) {
								url +=  '/' + this.get( 'id' );
							}
							return url;
						},

						// Include a reference to the original route object.
						route: modelRoute,

						// Include a reference to the original class name.
						name: modelClassName,

						// Include the array of route methods for easy reference.
						methods: modelRoute.route.methods
					} );
				}

				// Add defaults to the new model, pulled form the endpoint.
				wp.api.utils.decorateFromRoute(
					modelRoute.route.endpoints,
					loadingObjects.models[ modelClassName ],
					routeModel.get( 'versionString' )
				);

			} );

			/**
			 * Construct the collections.
			 *
			 * Base the class name on the route endpoint.
			 */
			_.each( collectionRoutes, function( collectionRoute ) {

				// Extract the name and any parent from the route.
				var collectionClassName, modelClassName,
						routeName  = collectionRoute.index.slice( collectionRoute.index.lastIndexOf( '/' ) + 1 ),
						parentName = wp.api.utils.extractRoutePart( collectionRoute.index, 1, routeModel.get( 'versionString' ), false );

				// If the collection has a parent in its route, add that to its class name.
				if ( '' !== parentName && parentName !== routeName && routeModel.get( 'versionString' ) !== parentName ) {

					collectionClassName = wp.api.utils.capitalizeAndCamelCaseDashes( parentName ) + wp.api.utils.capitalizeAndCamelCaseDashes( routeName );
					modelClassName      = mapping.models[ collectionClassName ] || collectionClassName;
					collectionClassName = mapping.collections[ collectionClassName ] || collectionClassName;
					loadingObjects.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {

						// Function that returns a constructed url passed on the parent.
						url: function() {
							return routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) +
									parentName + '/' + this.parent + '/' +
									routeName;
						},

						// Specify the model that this collection contains.
						model: function( attrs, options ) {
							return new loadingObjects.models[ modelClassName ]( attrs, options );
						},

						// Include a reference to the original class name.
						name: collectionClassName,

						// Include a reference to the original route object.
						route: collectionRoute,

						// Include the array of route methods for easy reference.
						methods: collectionRoute.route.methods
					} );
				} else {

					// This is a collection without a parent in its route.
					collectionClassName = wp.api.utils.capitalizeAndCamelCaseDashes( routeName );
					modelClassName      = mapping.models[ collectionClassName ] || collectionClassName;
					collectionClassName = mapping.collections[ collectionClassName ] || collectionClassName;
					loadingObjects.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {

						// For the url of a root level collection, use a string.
						url: function() {
							return routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) + routeName;
						},

						// Specify the model that this collection contains.
						model: function( attrs, options ) {
							return new loadingObjects.models[ modelClassName ]( attrs, options );
						},

						// Include a reference to the original class name.
						name: collectionClassName,

						// Include a reference to the original route object.
						route: collectionRoute,

						// Include the array of route methods for easy reference.
						methods: collectionRoute.route.methods
					} );
				}

				// Add defaults to the new model, pulled form the endpoint.
				wp.api.utils.decorateFromRoute( collectionRoute.route.endpoints, loadingObjects.collections[ collectionClassName ] );
			} );

			// Add mixins and helpers for each of the models.
			_.each( loadingObjects.models, function( model, index ) {
				loadingObjects.models[ index ] = wp.api.utils.addMixinsAndHelpers( model, index, loadingObjects );
			} );

			// Set the routeModel models and collections.
			routeModel.set( 'models', loadingObjects.models );
			routeModel.set( 'collections', loadingObjects.collections );

		}

	} );

	wp.api.endpoints = new Backbone.Collection();

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

		args                     = args || {};
		attributes.apiRoot       = args.apiRoot || wpApiSettings.root || '/wp-json';
		attributes.versionString = args.versionString || wpApiSettings.versionString || 'wp/v2/';
		attributes.schema        = args.schema || null;
		if ( ! attributes.schema && attributes.apiRoot === wpApiSettings.root && attributes.versionString === wpApiSettings.versionString ) {
			attributes.schema = wpApiSettings.schema;
		}

		if ( ! initializedDeferreds[ attributes.apiRoot + attributes.versionString ] ) {

			// Look for an existing copy of this endpoint
			endpoint = wp.api.endpoints.findWhere( { 'apiRoot': attributes.apiRoot, 'versionString': attributes.versionString } );
			if ( ! endpoint ) {
				endpoint = new Endpoint( attributes );
			}
			deferred = jQuery.Deferred();
			promise = deferred.promise();

			endpoint.schemaConstructed.done( function( resolvedEndpoint ) {
				wp.api.endpoints.add( resolvedEndpoint );

				// Map the default endpoints, extending any already present items (including Schema model).
				wp.api.models      = _.extend( wp.api.models, resolvedEndpoint.get( 'models' ) );
				wp.api.collections = _.extend( wp.api.collections, resolvedEndpoint.get( 'collections' ) );
				deferred.resolve( resolvedEndpoint );
			} );
			initializedDeferreds[ attributes.apiRoot + attributes.versionString ] = promise;
		}
		return initializedDeferreds[ attributes.apiRoot + attributes.versionString ];
	};

	/**
	 * Construct the default endpoints and add to an endpoints collection.
	 */

	// The wp.api.init function returns a promise that will resolve with the endpoint once it is ready.
	wp.api.loadPromise = wp.api.init();

} )();
