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

					// Single items end with a regex (or the special case 'me').
					if ( index.endsWith( '+)' ) || index.endsWith( 'me' ) ) {
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
						parentName = wp.api.utils.extractRoutePart( modelRoute.index, 4 ),
						routeEnd   = wp.api.utils.extractRoutePart( modelRoute.index, 1 );

				// Handle the special case of the 'me' route.
				if ( 'me' === routeEnd ) {
					routeName = 'me';
				}

				// If the model has a parent in its route, add that to its class name.
				if ( '' !== parentName && parentName !== routeName ) {
					modelClassName = wp.api.utils.capitalize( parentName ) + wp.api.utils.capitalize( routeName );
					modelClassName = mapping.models[ modelClassName ] || modelClassName;
					loadingObjects.models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {

						// Function that returns a constructed url based on the parent and id.
						url: function() {
							var url = routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) +
									parentName +  '/' +
									( ( _.isUndefined( this.get( 'parent' ) ) || 0 === this.get( 'parent' ) ) ?
										this.get( 'parent_post' ) :
										this.get( 'parent' ) ) + '/' +
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

						initialize: function() {
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
					modelClassName = wp.api.utils.capitalize( routeName );
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

				// Add defaults to the new model, pulled form the endpoint
				wp.api.utils.decorateFromRoute( modelRoute.route.endpoints, loadingObjects.models[ modelClassName ] );

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
						parentName = wp.api.utils.extractRoutePart( collectionRoute.index, 3 );

				// If the collection has a parent in its route, add that to its class name/
				if ( '' !== parentName && parentName !== routeName ) {

					collectionClassName = wp.api.utils.capitalize( parentName ) + wp.api.utils.capitalize( routeName );
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
						model: loadingObjects.models[ modelClassName ],

						// Include a reference to the original class name.
						name: collectionClassName,

						// Include a reference to the original route object.
						route: collectionRoute,

						// Include the array of route methods for easy reference.
						methods: collectionRoute.route.methods
					} );
				} else {

					// This is a collection without a parent in its route.
					collectionClassName = wp.api.utils.capitalize( routeName );
					modelClassName      = mapping.models[ collectionClassName ] || collectionClassName;
					collectionClassName = mapping.collections[ collectionClassName ] || collectionClassName;
					loadingObjects.collections[ collectionClassName ] = wp.api.WPApiBaseCollection.extend( {

						// For the url of a root level collection, use a string.
						url: routeModel.get( 'apiRoot' ) + routeModel.get( 'versionString' ) + routeName,

						// Specify the model that this collection contains.
						model: loadingObjects.models[ modelClassName ],

						// Include a reference to the original class name.
						name: collectionClassName,

						// Include a reference to the original route object.
						route: collectionRoute,

						// Include the array of route methods for easy reference.
						methods: collectionRoute.route.methods
					} );
				}

				// Add defaults to the new model, pulled form the endpoint
				wp.api.utils.decorateFromRoute( collectionRoute.route.endpoints, loadingObjects.collections[ collectionClassName ] );
			} );

			// Add mixins and helpers for each of the models.
			_.each( loadingObjects.models, function( model, index ) {
				loadingObjects.models[ index ] = wp.api.utils.addMixinsAndHelpers( model, index, loadingObjects );
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
	 * Construct the default endpoints and add to an endpoints collection.
	 */

	// The wp.api.init function returns a promise that will resolve with the endpoint once it is ready.
	wp.api.init();

})( window );
