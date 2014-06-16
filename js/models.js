/* global WP_API_Settings:false */
// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, WP_API_Settings, Backbone, _, window, undefined ) {

	'use strict';

	/**
	 * Array of parseable dates
	 *
	 * @type {string[]}
	 */
	var parseable_dates = [ 'date', 'modified', 'date_gmt', 'modified_gmt' ];

	/**
	 * Mixin for all content that is time stamped
	 *
	 * @type {{toJSON: toJSON, parse: parse}}
	 */
	var TimeStampedMixin = {
		/**
		 * Serialize the entity pre-sync
		 *
		 * @returns {*}
		 */
		toJSON: function() {
			var attributes = _.clone( this.attributes );

			// Serialize Date objects back into 8601 strings
			_.each( parseable_dates, function ( key ) {
				if ( key in attributes ) {
					attributes[key] = attributes[key].toISOString();
				}
			});

			return attributes;
		},

		/**
		 * Unserialize the fetched response
		 *
		 * @param {*} response
		 * @returns {*}
		 */
		parse: function( response ) {
			// Parse dates into native Date objects
			_.each( parseable_dates, function ( key ) {
				if ( ! ( key in response ) ) {
					return;
				}

				var timestamp = wp.api.utils.parseISO8601( response[key] );
				response[key] = new Date( timestamp );
			});

			// Parse the author into a User object
			if ( response.author !== 'undefined' ) {
				response.author = new wp.api.models.User( response.author );
			}

			return response;
		}
	};

	/**
	 * Mixin for all hierarchical content types such as posts
	 *
	 * @type {{parent: parent}}
	 */
	var HierarchicalMixin = {
		/**
		 * Get parent object
		 *
		 * @returns {Backbone.Model}
		 */
		parent: function() {

			var object, parent = this.get( 'parent' );

			// Return null if we don't have a parent
			if ( parent === 0 ) {
				return null;
			}

			var parentModel = this;

			if ( typeof this.parentModel !== 'undefined' ) {
				/**
				 * Probably a better way to do this. Perhaps grab a cached version of the
				 * instantiated model?
				 */
				parentModel = new this.parentModel();
			}

			// Can we get this from its collection?
			if ( parentModel.collection ) {
				return parentModel.collection.get( parent );
			} else {
				// Otherwise, get the object directly
				object = new parentModel.constructor( {
					ID: parent
				});

				// Note that this acts asynchronously
				object.fetch();
				return object;
			}
		}
	};

	/**
	 * Private Backbone base model for all models
	 */
	var BaseModel = Backbone.Model.extend(
		/** @lends BaseModel.prototype  */
		{
			/**
			 * Set nonce header before every Backbone sync
			 *
			 * @param {string} method
			 * @param {Backbone.Model} model
			 * @param {{beforeSend}, *} options
			 * @returns {*}
			 */
			sync: function( method, model, options ) {
				options = options || {};

				var beforeSend = options.beforeSend;
				options.beforeSend = function( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', WP_API_Settings.nonce );

					if ( beforeSend ) {
						return beforeSend.apply( this, arguments );
					}
				};

				return Backbone.sync( method, model, options );
			}
		}
	);

	/**
	 * Backbone model for single users
	 */
	wp.api.models.User = BaseModel.extend(
		/** @lends User.prototype  */
		{
			idAttribute: 'ID',

			urlRoot: WP_API_Settings.root + '/users',

			defaults: {
				ID: null,
				username: '',
				email: '',
				password: '',
				name: '',
				first_name: '',
				last_name: '',
				nickname: '',
				slug: '',
				URL: '',
				avatar: '',
				meta: {
					links: {}
				}
			},

			/**
			 * Return avatar URL
			 *
			 * @param {number} size
			 * @returns {string}
			 */
			avatar: function( size ) {
				return this.get( 'avatar' ) + '&s=' + size;
			}
		}
	);

	/**
	 * Model for Taxonomy
	 */
	wp.api.models.Taxonomy = BaseModel.extend(
		/** @lends Taxonomy.prototype  */
		{
			idAttribute: 'slug',

			urlRoot: WP_API_Settings.root + '/taxonomies',

			defaults: {
				name: '',
				slug: null,
				labels: {},
				types: {},
				show_cloud: false,
				hierarchical: false,
				meta: {
					links: {}
				}
			}
		}
	);

	/**
	 * Backbone model for term
	 */
	wp.api.models.Term = BaseModel.extend( _.extend(
		/** @lends Term.prototype */
		{
			idAttribute: 'ID',

			taxonomy: 'category',

			/**
			 * @class Represent a term
			 * @augments Backbone.Model
			 * @constructs
			 */
			initialize: function( attributes, options ) {
				if ( typeof options !== 'undefined' ) {
					if ( options.taxonomy ) {
						this.taxonomy = options.taxonomy;
					}
				}
			},

			/**
			 * Return URL for the model
			 *
			 * @returns {string}
			 */
			url: function() {
				var id = this.get( 'ID' );
				id = id || '';

				return WP_API_Settings.root + '/taxonomies/' + this.taxonomy + '/terms/' + id;
			},

			defaults: {
				ID: null,
				name: '',
				slug: '',
				description: '',
				parent: null,
				count: 0,
				link: '',
				meta: {
					links: {}
				}
			}

		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for single posts
	 */
	wp.api.models.Post = BaseModel.extend( _.extend(
		/** @lends Post.prototype  */
		{
			idAttribute: 'ID',

			urlRoot: WP_API_Settings.root + '/posts',

			defaults: {
				ID: null,
				title: '',
				status: 'draft',
				type: 'post',
				author: new wp.api.models.User(),
				content: '',
				link: '',
				'parent': 0,
				date: new Date(),
				date_gmt: new Date(),
				modified: new Date(),
				modified_gmt: new Date(),
				format: 'standard',
				slug: '',
				guid: '',
				excerpt: '',
				menu_order: 0,
				comment_status: 'open',
				ping_status: 'open',
				sticky: false,
				date_tz: 'Etc/UTC',
				modified_tz: 'Etc/UTC',
				featured_image: null,
				terms: {},
				post_meta: {},
				meta: {
					links: {}
				}
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for pages
	 */
	wp.api.models.Page = BaseModel.extend( _.extend(
		/** @lends Page.prototype  */
		{
			idAttribute: 'ID',

			urlRoot: WP_API_Settings.root + '/pages',

			defaults: {
				ID: null,
				title: '',
				status: 'draft',
				type: 'page',
				author: new wp.api.models.User(),
				content: '',
				parent: 0,
				link: '',
				date: new Date(),
				modified: new Date(),
				date_gmt: new Date(),
				modified_gmt: new Date(),
				date_tz: 'Etc/UTC',
				modified_tz: 'Etc/UTC',
				format: 'standard',
				slug: '',
				guid: '',
				excerpt: '',
				menu_order: 0,
				comment_status: 'closed',
				ping_status: 'open',
				sticky: false,
				password: '',
				meta: {
					links: {}
				},
				featured_image: null,
				terms: []
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for revisions
	 */
	wp.api.models.Revision = wp.api.models.Post.extend(
		/** @lends Revision.prototype */
		{
			/**
			 * Return URL for model
			 *
			 * @returns {string}
			 */
			url: function() {
				var parent_id = this.get( 'parent' );
				parent_id = parent_id || '';

				var id = this.get( 'ID' );
				id = id || '';

				return WP_API_Settings.root + '/posts/' + parent_id + '/revisions/' + id;
			},

			/**
			 * @class Represent a revision
			 * @augments Backbone.Model
			 * @constructs
			 */
			initialize: function() {
				// Todo: what of the parent model is a page?
				this.parentModel = wp.api.models.Post;
			}
		}
	);

	/**
	 * Backbone model for media items
	 */
	wp.api.models.Media = BaseModel.extend( _.extend(
		/** @lends Media.prototype */
		{
			idAttribute: 'ID',

			urlRoot: WP_API_Settings.root + '/media',

			defaults: {
				ID: null,
				title: '',
				status: 'inherit',
				type: 'attachment',
				author: new wp.api.models.User(),
				content: '',
				parent: 0,
				link: '',
				date: new Date(),
				modified: new Date(),
				format: 'standard',
				slug: '',
				guid: '',
				excerpt: null,
				menu_order: 0,
				comment_status: 'open',
				ping_status: 'open',
				sticky: false,
				date_tz: 'Etc/UTC',
				modified_tz: 'Etc/UTC',
				date_gmt: new Date(),
				modified_gmt: new Date(),
				meta: {
					links: {}
				},
				terms: [],
				source: '',
				is_image: true,
				attachment_meta: {},
				image_meta: {}
			},

			/**
			 * @class Represent a media item
			 * @augments Backbone.Model
			 * @constructs
			 */
			initialize: function() {
				// Todo: what of the parent model is a page?
				this.parentModel = wp.api.models.Post;
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for comments
	 */
	wp.api.models.Comment = BaseModel.extend( _.extend(
		/** @lends Comment.prototype */
		{
			idAttribute: 'ID',

			defaults: {
				ID: null,
				post: null,
				content: '',
				status: 'hold',
				type: '',
				parent: 0,
				author: new wp.api.models.User(),
				date: new Date(),
				date_gmt: new Date(),
				date_tz: 'Etc/UTC',
				meta: {
					links: {}
				}
			},

			/**
			 * Return URL for model
			 *
			 * @returns {string}
			 */
			url: function() {
				var post_id = this.get( 'post' );
				post_id = post_id || '';

				var id = this.get( 'ID' );
				id = id || '';

				return WP_API_Settings.root + '/posts/' + post_id + '/comments/' + id;
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for single post types
	 */
	wp.api.models.PostType = BaseModel.extend(
		/** @lends PostType.prototype */
		{
			idAttribute: 'slug',

			urlRoot: WP_API_Settings.root + '/posts/types',

			defaults: {
				slug: null,
				name: '',
				description: '',
				labels: {},
				queryable: false,
				searchable: false,
				hierarchical: false,
				meta: {
					links: {}
				},
				taxonomies: []
			},

			/**
			 * Prevent model from being saved
			 *
			 * @returns {boolean}
			 */
			save: function () {
				return false;
			},

			/**
			 * Prevent model from being deleted
			 *
			 * @returns {boolean}
			 */
			'delete': function () {
				return false;
			}
		}
	);

	/**
	 * Backbone model for a post status
	 */
	wp.api.models.PostStatus = BaseModel.extend(
		/** @lends PostStatus.prototype */
		{
			idAttribute: 'slug',

			urlRoot: WP_API_Settings.root + '/posts/statuses',

			defaults: {
				slug: null,
				name: '',
				'public': true,
				'protected': false,
				'private': false,
				queryable: true,
				show_in_list: true,
				meta: {
					links: {}
				}
			},

			/**
			 * Prevent model from being saved
			 *
			 * @returns {boolean}
			 */
			save: function() {
				return false;
			},

			/**
			 * Prevent model from being deleted
			 *
			 * @returns {boolean}
			 */
			'delete': function() {
				return false;
			}
		}
	);

})( wp, WP_API_Settings, Backbone, _, window );
