/* global WP_API_Settings:false */
(function( wp, WP_API_Settings, Backbone, _, window, undefined ) {

	'use strict';

	/**
	 * Contains basic collection functionality such as pagination.
	 */
	var BaseCollection = Backbone.Collection.extend(
		/** @lends BaseCollection.prototype  */
		{

			/**
			 * Setup default state.
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
			 * Overwrite Backbone.Collection.sync to pagination state based on response headers.
			 *
			 * Set nonce header before every Backbone sync.
			 *
			 * @param {string} method.
			 * @param {Backbone.Model} model.
			 * @param {{success}, *} options.
			 * @returns {*}.
			 */
			sync: function( method, model, options ) {
				options = options || {};
				var beforeSend = options.beforeSend,
					self = this;

				if ( 'undefined' !== typeof WP_API_Settings.nonce ) {
					options.beforeSend = function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', WP_API_Settings.nonce );

						if ( beforeSend ) {
							return beforeSend.apply( self, arguments );
						}
					};
				}

				if ( 'read' === method ) {
					if ( options.data ) {
						self.state.data = _.clone( options.data );

						delete self.state.data.page;
					} else {
						self.state.data = options.data = {};
					}

					if ( 'undefined' === typeof options.data.page ) {
						self.state.currentPage = null;
						self.state.totalPages = null;
						self.state.totalObjects = null;
					} else {
						self.state.currentPage = options.data.page - 1;
					}

					var success = options.success;
					options.success = function( data, textStatus, request ) {
						self.state.totalPages = parseInt( request.getResponseHeader( 'x-wp-totalpages' ), 10 );
						self.state.totalObjects = parseInt( request.getResponseHeader( 'x-wp-total' ), 10 );

						if ( self.state.currentPage === null ) {
							self.state.currentPage = 1;
						} else {
							self.state.currentPage++;
						}

						if ( success ) {
							return success.apply( this, arguments );
						}
					};
				}

				return Backbone.sync( method, model, options );
			},

			/**
			 * Fetches the next page of objects if a new page exists.
			 *
			 * @param {data: {page}} options.
			 * @returns {*}.
			 */
			more: function( options ) {
				options = options || {};
				options.data = options.data || {};

				_.extend( options.data, this.state.data );

				if ( 'undefined' === typeof options.data.page ) {
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
			 * Returns true if there are more pages of objects available.
			 *
			 * @returns null|boolean.
			 */
			hasMore: function() {
				if ( this.state.totalPages === null ||
					 this.state.totalObjects === null ||
					 this.state.currentPage === null ) {
					return null;
				} else {
					return ( this.state.currentPage < this.state.totalPages );
				}
			}
		}
	);

	/**
	 * Backbone collection for posts.
	 */
	wp.api.collections.Posts = BaseCollection.extend(
		/** @lends Posts.prototype */
		{
			url: WP_API_Settings.root + 'wp/v2/posts',

			model: wp.api.models.Post
		}
	);

	/**
	 * Backbone collection for pages.
	 */
	wp.api.collections.Pages = BaseCollection.extend(
		/** @lends Pages.prototype */
		{
			url: WP_API_Settings.root + 'wp/v2/pages',

			model: wp.api.models.Page
		}
	);

	/**
	 * Backbone users collection.
	 */
	wp.api.collections.Users = BaseCollection.extend(
		/** @lends Users.prototype */
		{
			url: WP_API_Settings.root + 'wp/v2/users',

			model: wp.api.models.User
		}
	);

	/**
	 * Backbone post statuses collection.
	 */
	wp.api.collections.PostStatuses = BaseCollection.extend(
		/** @lends PostStatuses.prototype */
		{
			url: WP_API_Settings.root + 'wp/v2/statuses',

			model: wp.api.models.PostStatus,

			parse: function( response ) {
				var responseArray = [];

				for ( var property in response ) {
					if ( response.hasOwnProperty( property ) ) {
						responseArray.push( response[property] );
					}
				}

				return this.constructor.__super__.parse.call( this, responseArray );
			}
		}
	);

	/**
	 * Backbone media library collection.
	 */
	wp.api.collections.MediaLibrary = BaseCollection.extend(
		/** @lends MediaLibrary.prototype */
		{
			url: WP_API_Settings.root + 'wp/v2/media',

			model: wp.api.models.Media
		}
	);

	/**
	 * Backbone taxonomy collection.
	 */
	wp.api.collections.Taxonomies = BaseCollection.extend(
		/** @lends Taxonomies.prototype */
		{
			model: wp.api.models.Taxonomy,

			url: WP_API_Settings.root + 'wp/v2/taxonomies'
		}
	);

	/**
	 * Backbone comment collection.
	 */
	wp.api.collections.Comments = BaseCollection.extend(
		/** @lends Comments.prototype */
		{
			model: wp.api.models.Comment,

			/**
			 * Return URL for collection.
			 *
			 * @returns {string}.
			 */
			url: WP_API_Settings.root + 'wp/v2/comments'
		}
	);

	/**
	 * Backbone post type collection.
	 */
	wp.api.collections.PostTypes = BaseCollection.extend(
		/** @lends PostTypes.prototype */
		{
			model: wp.api.models.PostType,

			url: WP_API_Settings.root + 'wp/v2/types',

			parse: function( response ) {
				var responseArray = [];

				for ( var property in response ) {
					if ( response.hasOwnProperty( property ) ) {
						responseArray.push( response[property] );
					}
				}

				return this.constructor.__super__.parse.call( this, responseArray );
			}
		}
	);

	/**
	 * Backbone terms collection.
	 *
	 * Usage: new wp.api.collections.Terms( {}, { taxonomy: 'taxonomy-slug' } )
	 */
	wp.api.collections.Terms = BaseCollection.extend(
		/** @lends Terms.prototype */
		{
			model: wp.api.models.Term,

			taxonomy: 'category',

			/**
			 * @class Represent an array of terms.
			 * @augments Backbone.Collection.
			 * @constructs
			 */
			initialize: function( models, options ) {
				if ( 'undefined' !== typeof options && options.taxonomy ) {
					this.taxonomy = options.taxonomy;
				}

				BaseCollection.prototype.initialize.apply( this, arguments );
			},

			/**
			 * Return URL for collection.
			 *
			 * @returns {string}.
			 */
			url: function() {
				return WP_API_Settings.root + 'wp/v2/terms/' + this.taxonomy;
			}
		}
	);

	/**
	 * Backbone revisions collection.
	 *
	 * Usage: new wp.api.collections.Revisions( {}, { parent: POST_ID } ).
	 */
	wp.api.collections.Revisions = BaseCollection.extend(
		/** @lends Revisions.prototype */
		{
			model: wp.api.models.Revision,

			parent: null,

			/**
			 * @class Represent an array of revisions.
			 * @augments Backbone.Collection.
			 * @constructs
			 */
			initialize: function( models, options ) {
				BaseCollection.prototype.initialize.apply( this, arguments );

				if ( options && options.parent ) {
					this.parent = options.parent;
				}
			},

			/**
			 * return URL for collection.
			 *
			 * @returns {string}.
			 */
			url: function() {
				return WP_API_Settings.root + 'wp/v2/posts/' + this.parent + '/revisions';
			}
		}
	);

	/**
	 * Todo: Handle schema endpoints.
	 */

	/**
	 * Todo: Handle post meta.
	 */

})( wp, WP_API_Settings, Backbone, _, window );
