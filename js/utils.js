(function( window, undefined ) {

	'use strict';

	window.wp = window.wp || {};
	wp.api = wp.api || {};
	wp.api.utils = wp.api.utils || {};

	/**
	 * Helper function for getting the root URL.
	 * @return {[type]} [description]
	 */
	wp.api.utils.getRootUrl = function() {
		return window.location.origin ?
			window.location.origin + '/' :
			window.location.protocol + '/' + window.location.host + '/';
	};

	/**
	 * Helper for capitalizing strings.
	 */
	wp.api.utils.capitalize = function( str ) {
		if ( _.isUndefined( str ) ) {
			return str;
		}
		return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
	};

	/**
	 * Extract a route part based on negative index.
	 *
	 * @param {string} route The endpoint route.
	 * @param {int}    part  The number of parts from the end of the route to retrieve. Default 1.
	 *                       Example route `/a/b/c`: part 1 is `c`, part 2 is `b`, part 3 is `a`.
	 */
	wp.api.utils.extractRoutePart = function( route, part ) {
		var routeParts;

		part  = part || 1;

		// Remove versions string from route to avoid returning it.
		route = route.replace( wp.api.versionString, '' );
		routeParts = route.split( '/' ).reverse();
		if ( _.isUndefined( routeParts[ --part ] ) ) {
			return '';
		}
		return routeParts[ part ];
	};

	/**
	 * Extract a parent name from a passed route.
	 *
	 * @param {string} route The route to extract a name from.
	 */
	wp.api.utils.extractParentName = function( route ) {
		var name,
			lastSlash = route.lastIndexOf( '_id>[\\d]+)/' );

		if ( lastSlash < 0 ) {
			return '';
		}
		name = route.substr( 0, lastSlash - 1 );
		name = name.split( '/' );
		name.pop();
		name = name.pop();
		return name;
	};

	/**
	 * Add args and options to a model prototype from a route's endpoints.
	 *
	 * @param {array}  routeEndpoints Array of route endpoints.
	 * @param {Object} modelInstance  An instance of the model (or collection)
	 *                                to add the args to.
	 */
	wp.api.utils.decorateFromRoute = function( routeEndpoints, modelInstance ) {

		/**
		 * Build the args based on route endpoint data.
		 */
		_.each( routeEndpoints, function( routeEndpoint ) {

			// Add post and edit endpoints as model args.
			if ( _.includes( routeEndpoint.methods, 'POST' ) || _.includes( routeEndpoint.methods, 'PUT' ) ) {

				// Add any non empty args, merging them into the args object.
				if ( ! _.isEmpty( routeEndpoint.args ) ) {

					// Set as defauls if no args yet.
					if ( _.isEmpty( modelInstance.prototype.args ) ) {
						modelInstance.prototype.args = routeEndpoint.args;
					} else {

						// We already have args, merge these new args in.
						modelInstance.prototype.args = _.union( routeEndpoint.args, modelInstance.prototype.defaults );
					}
				}
			} else {

				// Add GET method as model options.
				if ( _.includes( routeEndpoint.methods, 'GET' ) ) {

					// Add any non empty args, merging them into the defaults object.
					if ( ! _.isEmpty( routeEndpoint.args ) ) {

						// Set as defauls if no defaults yet.
						if ( _.isEmpty( modelInstance.prototype.options ) ) {
							modelInstance.prototype.options = routeEndpoint.args;
						} else {

							// We already have options, merge these new args in.
							modelInstance.prototype.options = _.union( routeEndpoint.args, modelInstance.prototype.options );
						}
					}

				}
			}

		} );

	};

	/**
	 * Add mixins and helpers to models depending on their defaults.
	 *
	 * @param {Backbone Model} model          The model to attach helpers and mixins to.
	 * @param {string}         modelClassName The classname of the constructed model.
	 * @param {Object} 	       loadingObjects An object containing the models and collections we are building.
	 */
	wp.api.utils.addMixinsAndHelpers = function( model, modelClassName, loadingObjects ) {

			/**
			 * Build a helper function to retrieve related model.
			 *
			 * @param  {string} parentModel      The parent model.
			 * @param  {int}    modelId          The model ID if the object to request
			 * @param  {string} modelName        The model name to use when constructing the model.
			 * @param  {string} embedSourcePoint Where to check the embedds object for _embed data.
			 * @param  {string} embedCheckField  Which model field to check to see if the model has data.
			 *
			 * @return {Deferred.promise}        A promise which resolves to the constructed model.
			 */
		var buildModelGetter = function( parentModel, modelId, modelName, embedSourcePoint, embedCheckField ) {
				var getModel, embeddeds, attributes, deferred;

				deferred  = jQuery.Deferred();
				embeddeds = parentModel.get( '_embedded' ) || {};

				// Verify that we have a valied object id.
				if ( ! _.isNumber( modelId ) || 0 === modelId ) {
					deferred.reject();
					return deferred;
				}

				// If we have embedded object data, use that when constructing the getModel.
				if ( embeddeds[ embedSourcePoint ] ) {
					attributes = _.findWhere( embeddeds[ embedSourcePoint ], { id: modelId } );
				}

				// Otherwise use the modelId.
				if ( ! attributes ) {
					attributes = { id: modelId };
				}

				// Create the new getModel model.
				getModel = new wp.api.models[ modelName ]( attributes );

				// If we didn’t have an embedded getModel, fetch the getModel data.
				if ( ! getModel.get( embedCheckField ) ) {
					getModel.fetch( { success: function( getModel ) {
						deferred.resolve( getModel );
					} } );
				} else {
					deferred.resolve( getModel );
				}

				// Return a promise.
				return deferred.promise();
			},

			/**
			 * Build a helper to retrieve a collection.
			 *
			 * @param  {string} parentModel      The parent model.
			 * @param  {string} collectionName   The name to use when constructing the collection.
			 * @param  {string} embedSourcePoint Where to check the embedds object for _embed data.
			 * @param  {string} embedIndex       An addiitonal optional index for the _embed data.
			 *
			 * @return {Deferred.promise}        A promise which resolves to the constructed collection.
			 */
			buildCollectionGetter = function( parentModel, collectionName, embedSourcePoint, embedIndex ) {
				/**
				 * Returns a promise that resolves to the requested collection
				 *
				 * Uses the embedded data if available, otherwises fetches the
				 * data from the server.
				 *
				 * @return {Deferred.promise} promise Resolves to a wp.api.collections[ collectionName ]
				 * collection.
				 */
				var postId, embeddeds, getObjects,
					classProperties = '',
					properties      = '',
					deferred        = jQuery.Deferred();

				postId    = parentModel.get( 'id' );
				embeddeds = parentModel.get( '_embedded' ) || {};

				// Verify that we have a valied post id.
				if ( ! _.isNumber( postId ) || 0 === postId ) {
					deferred.reject();
					return deferred;
				}

				// If we have embedded getObjects data, use that when constructing the getObjects.
				if ( ! _.isUndefined( embedSourcePoint ) && ! _.isUndefined( embeddeds[ embedSourcePoint ] ) ) {

					// Some embeds also include an index offset, check for that.
					if ( _.isUndefined( embedIndex ) ) {

						// Use the embed source point directly.
						properties = embeddeds[ embedSourcePoint ];
					} else {

						// Add the index to the embed source point.
						properties = embeddeds[ embedSourcePoint ][ embedIndex ];
					}
				} else {

					// Otherwise use the postId.
					classProperties = { parent: postId };
				}

				// Create the new getObjects collection.
				getObjects = new wp.api.collections[ collectionName ]( properties, classProperties );

				// If we didn’t have embedded getObjects, fetch the getObjects data.
				if ( _.isUndefined( getObjects.models[0] ) ) {
					getObjects.fetch( { success: function( getObjects ) {

						// Add a helper 'parent_post' attribute onto the model.
						setHelperParentPost( getObjects, postId );
						deferred.resolve( getObjects );
					} } );
				} else {

					// Add a helper 'parent_post' attribute onto the model.
					setHelperParentPost( getObjects, postId );
					deferred.resolve( getObjects );
				}

				// Return a promise.
				return deferred.promise();

			},

			/**
			 * Set the model post parent.
			 */
			setHelperParentPost = function( collection, postId ) {

				// Attach post_parent id to the collection.
				_.each( collection.models, function( model ) {
					model.set( 'parent_post', postId );
				} );
			},

			/**
			 * Add a helper funtion to handle post Meta.
			 */
			MetaMixin = {
				getMeta: function() {
					return buildCollectionGetter( this, 'PostMeta', 'https://api.w.org/meta' );
				}
			},

			/**
			 * Add a helper funtion to handle post Revisions.
			 */
			RevisionsMixin = {
				getRevisions: function() {
					return buildCollectionGetter( this, 'PostRevisions' );
				}
			},

			/**
			 * Add a helper funtion to handle post Tags.
			 */
			TagsMixin = {

				/**
				 * Get the tags for a post.
				 *
				 * @return {Deferred.promise} promise Resolves to an array of tags.
				 */
				getTags: function() {
					var tagIds = this.get( 'tags' ),
						tags  = new wp.api.collections.Tags();

					// Resolve with an empty array if no tags.
					if ( _.isEmpty( tagIds ) ) {
						return jQuery.Deferred().resolve( [] );
					}

					return tags.fetch( { data: { include: tagIds } } );
				},

				/**
				 * Set the tags for a post.
				 *
				 * Accepts an array of tag slugs, or a Tags collection.
				 *
				 * @param {array|Backbone.Collection} tags The tags to set on the post.
				 *
				 */
				setTags: function( tags ) {
					var allTags, newTag,
						self = this,
						newTags = [];

					if ( _.isString( tags ) ) {
						return false;
					}

					// If this is an array of slugs, build a collection.
					if ( _.isArray( tags ) ) {

						// Get all the tags.
						allTags = new wp.api.collections.Tags();
						allTags.fetch( {
							data:    { per_page: 100 },
							success: function( alltags ) {

								// Find the passed tags and set them up.
								_.each( tags, function( tag ) {
									newTag = new wp.api.models.Tag( alltags.findWhere( { slug: tag } ) );

									// Tie the new tag to the post.
									newTag.set( 'parent_post', self.get( 'id' ) );

									// Add the new tag to the collection.
									newTags.push( newTag );
								} );
								tags = new wp.api.collections.Tags( newTags );
								self.setTagsWithCollection( tags );
							}
						} );

					} else {
						this.setTagsWithCollection( tags );
					}
				},

				/**
				 * Set the tags for a post.
				 *
				 * Accepts a Tags collection.
				 *
				 * @param {array|Backbone.Collection} tags The tags to set on the post.
				 *
				 */
				setTagsWithCollection: function( tags ) {

					// Pluck out the category ids.
					this.set( 'tags', tags.pluck( 'id' ) );
					return this.save();
				}
			},

			/**
			 * Add a helper funtion to handle post Categories.
			 */
			CategoriesMixin = {

				/**
				 * Get a the categories for a post.
				 *
				 * @return {Deferred.promise} promise Resolves to an array of categories.
				 */
				getCategories: function() {
					var categoryIds = this.get( 'categories' ),
						categories  = new wp.api.collections.Categories();

					// Resolve with an empty array if no categories.
					if ( _.isEmpty( categoryIds ) ) {
						return jQuery.Deferred().resolve( [] );
					}

					return categories.fetch( { data: { include: categoryIds } } );
				},

				/**
				 * Set the categories for a post.
				 *
				 * Accepts an array of category slugs, or a Categories collection.
				 *
				 * @param {array|Backbone.Collection} categories The categories to set on the post.
				 *
				 */
				setCategories: function( categories ) {
					var allCategories, newCategory,
						self = this,
						newCategories = [];

					if ( _.isString( categories ) ) {
						return false;
					}

					// If this is an array of slugs, build a collection.
					if ( _.isArray( categories ) ) {

						// Get all the categories.
						allCategories = new wp.api.collections.Categories();
						allCategories.fetch( {
							data:    { per_page: 100 },
							success: function( allcats ) {

								// Find the passed categories and set them up.
								_.each( categories, function( category ) {
									newCategory = new wp.api.models.Category( allcats.findWhere( { slug: category } ) );

									// Tie the new category to the post.
									newCategory.set( 'parent_post', self.get( 'id' ) );

									// Add the new category to the collection.
									newCategories.push( newCategory );
								} );
								categories = new wp.api.collections.Categories( newCategories );
								self.setCategoriesWithCollection( categories );
							}
						} );

					} else {
						this.setCategoriesWithCollection( categories );
					}

				},

				/**
				 * Set the categories for a post.
				 *
				 * Accepts Categories collection.
				 *
				 * @param {array|Backbone.Collection} categories The categories to set on the post.
				 *
				 */
				setCategoriesWithCollection: function( categories ) {

					// Pluck out the category ids.
					this.set( 'categories', categories.pluck( 'id' ) );
					return this.save();
				}
			},

			/**
			 * Add a helper function to retrieve the author user model.
			 */
			AuthorMixin = {
				getAuthorUser: function() {
					return buildModelGetter( this, this.get( 'author' ), 'User', 'author', 'name' );
				}
			},

			/**
			 * Add a helper function to retrieve the featured media.
			 */
			FeaturedMediaMixin = {
				getFeaturedMedia: function() {
					return buildModelGetter( this, this.get( 'featured_media' ), 'Media', 'wp:featuredmedia', 'source_url' );
				}
			};

		// Exit if we don't have valid model defaults.
		if ( _.isUndefined( model.prototype.args ) ) {
			return model;
		}

		// Add the AuthorMixin for models that contain an author.
		if ( ! _.isUndefined( model.prototype.args.author ) ) {
			model = model.extend( AuthorMixin );
		}

		// Add the FeaturedMediaMixin for models that contain a featured_media.
		if ( ! _.isUndefined( model.prototype.args.featured_media ) ) {
			model = model.extend( FeaturedMediaMixin );
		}

		// Add the CategoriesMixin for models that support categories collections.
		if ( ! _.isUndefined( model.prototype.args.categories ) ) {
			model = model.extend( CategoriesMixin );
		}

		// Add the MetaMixin for models that support meta collections.
		if ( ! _.isUndefined( loadingObjects.collections[ modelClassName + 'Meta' ] ) ) {
			model = model.extend( MetaMixin );
		}

		// Add the TagsMixin for models that support tags collections.
		if ( ! _.isUndefined( model.prototype.args.tags ) ) {
			model = model.extend( TagsMixin );
		}

		// Add the RevisionsMixin for models that support revisions collections.
		if ( ! _.isUndefined( loadingObjects.collections[ modelClassName + 'Revisions' ] ) ) {
			model = model.extend( RevisionsMixin );
		}

		return model;
	};

})( window );
