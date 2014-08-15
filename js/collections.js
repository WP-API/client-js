/* global WP_API_Settings:false */
(function( wp, WP_API_Settings, Backbone, _, window, undefined ) {

	'use strict';

	var BaseCollection = Backbone.Collection.extend(
		/** @lends BaseCollection.prototype  */
		{

			/**
			 * Setup default state
			 */
			initialize: function() {
				this.state = {
					data: {},
					currentPage: null,
					totalPages: null,
					totalObjects: null
				};
			},

			/**
			 * Overwrite Backbone.Collection.sync to pagination state based on response headers
			 *
			 * @param {string} method
			 * @param {Backbone.Model} model
			 * @param {{success}, *} options
			 * @returns {*}
			 */
			sync: function( method, model, options ) {
				if ( 'read' === method ) {
					var SELF = this;

					options = options || {};
					if ( options.data ) {
						SELF.state.data = _.clone( options.data );

						delete SELF.state.data.page;
					} else {
						SELF.state.data = options.data = {};
					}

					if ( typeof options.data.page === 'undefined' ) {
						SELF.state.currentPage = null;
						SELF.state.totalPages = null;
						SELF.state.totalObjects = null;
					}

					var success = options.success;
					options.success = function( data, textStatus, request ) {
						SELF.state.totalPages = parseInt( request.getResponseHeader( 'X-WP-TotalPages' ) );
						SELF.state.totalObjects = parseInt( request.getResponseHeader( 'X-WP-Total' ) );

						if ( SELF.state.currentPage === null ) {
							SELF.state.currentPage = 1;
						} else {
							SELF.state.currentPage++;
						}

						if ( success ) {
							return success.apply( this, arguments );
						}
					};
				}

				return Backbone.sync( method, model, options );
			},

			/**
			 * Fetches the next page of objects if a new page exists
			 *
			 * @param {data: {page}} options
			 * @returns {*}
			 */
			more: function( options ) {
				options = options || {};
				options.data = options.data || {};
				
				_.extend( options.data, this.state.data );

				if ( typeof options.data.page === 'undefined' ) {
					if ( ! this.hasMore() ) {
						return false;
					}

					if ( this.state.currentPage === null || this.state.currentPage <= 1 ) {
						options.data.page = 2;
					} else {
						options.data.page = this.state.currentPage + 1;
					}
				}

				return this.fetch( options );
			},

			/**
			 * Returns true if there are more pages of objects available
			 *
			 * @returns null|boolean
			 */
			hasMore: function() {
				if ( this.state.totalPages === null ||
					 this.state.totalObjects === null ||
					 this.state.currentPage === null ) {
					return null
				} else {
					return ( this.state.currentPage < this.state.totalPages );
				}
			}
		}
	);

	/**
	 * Backbone collection for posts
	 */
	wp.api.collections.Posts = BaseCollection.extend(
		/** @lends Posts.prototype */
		{
			url: WP_API_Settings.root + '/posts',

			model: wp.api.models.Post
		}
	);

	/**
	 * Backbone collection for pages
	 */
	wp.api.collections.Pages = BaseCollection.extend(
		/** @lends Pages.prototype */
		{
			url: WP_API_Settings.root + '/pages',

			model: wp.api.models.Page
		}
	);

	/**
	 * Backbone users collection
	 */
	wp.api.collections.Users = BaseCollection.extend(
		/** @lends Users.prototype */
		{
			url: WP_API_Settings.root + '/users',

			model: wp.api.models.User
		}
	);

	/**
	 * Backbone post statuses collection
	 */
	wp.api.collections.PostStatuses = BaseCollection.extend(
		/** @lends PostStatuses.prototype */
		{
			url: WP_API_Settings.root + '/posts/statuses',

			model: wp.api.models.PostStatus

		}
	);

	/**
	 * Backbone media library collection
	 */
	wp.api.collections.MediaLibrary = BaseCollection.extend(
		/** @lends MediaLibrary.prototype */
		{
			url: WP_API_Settings.root + '/media',

			model: wp.api.models.Media
		}
	);

	/**
	 * Backbone taxonomy collection
	 */
	wp.api.collections.Taxonomies = BaseCollection.extend(
		/** @lends Taxonomies.prototype */
		{
			model: wp.api.models.Taxonomy,

			url: WP_API_Settings.root + '/taxonomies'
		}
	);

	/**
	 * Backbone comment collection
	 */
	wp.api.collections.Comments = BaseCollection.extend(
		/** @lends Comments.prototype */
		{
			model: wp.api.models.Comment,

			post: null,

			/**
			 * @class Represent an array of comments
			 * @augments Backbone.Collection
			 * @constructs
			 */
			initialize: function( models, options ) {
				this.constructor.__super__.initialize.apply( this, arguments );

				if ( options && options.post ) {
					this.post = options.post;
				}
			},

			/**
			 * Return URL for collection
			 *
			 * @returns {string}
			 */
			url: function() {
				return WP_API_Settings.root + '/posts/' + this.post + '/comments';
			}
		}
	);

	/**
	 * Backbone post type collection
	 */
	wp.api.collections.PostTypes = BaseCollection.extend(
		/** @lends PostTypes.prototype */
		{
			model: wp.api.models.PostType,

			url: WP_API_Settings.root + '/posts/types'
		}
	);

	/**
	 * Backbone terms collection
	 */
	wp.api.collections.Terms = BaseCollection.extend(
		/** @lends Terms.prototype */
		{
			model: wp.api.models.Term,

			type: 'post',

			taxonomy: 'category',

			/**
			 * @class Represent an array of terms
			 * @augments Backbone.Collection
			 * @constructs
			 */
			initialize: function( models, options ) {
				this.constructor.__super__.initialize.apply( this, arguments );

				if ( typeof options !== 'undefined' ) {
					if ( options.type ) {
						this.type = options.type;
					}

					if ( options.taxonomy ) {
						this.taxonomy = options.taxonomy;
					}
				}

				this.on( 'add', _.bind( this.addModel, this ) );
			},

			/**
			 * We need to set the type and taxonomy for each model
			 *
			 * @param {Backbone.model} model
			 */
			addModel: function( model ) {
				model.type = this.type;
				model.taxonomy = this.taxonomy;
			},

			/**
			 * Return URL for collection
			 *
			 * @returns {string}
			 */
			url: function() {
				return WP_API_Settings.root + '/posts/types/' + this.type + '/taxonomies/' + this.taxonomy + '/terms/';
			}
		}
	);

	/**
	 * Backbone revisions collection
	 */
	wp.api.collections.Revisions = BaseCollection.extend(
		/** @lends Revisions.prototype */
		{
			model: wp.api.models.Revision,

			parent: null,

			/**
			 * @class Represent an array of revisions
			 * @augments Backbone.Collection
			 * @constructs
			 */
			initialize: function( models, options ) {
				this.constructor.__super__.initialize.apply( this, arguments );

				if ( options && options.parent ) {
					this.parent = options.parent;
				}
			},

			/**
			 * return URL for collection
			 *
			 * @returns {string}
			 */
			url: function() {
				return WP_API_Settings.root + '/posts/' + this.parent + '/revisions';
			}
		}
	);

})( wp, WP_API_Settings, Backbone, _, window );
