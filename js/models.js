/* global WP_API_Settings:false */
// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, WP_API_Settings, Backbone, window, undefined ) {

	'use strict';

	/**
	 * Array of parseable dates.
	 *
	 * @type {string[]}.
	 */
	var parseable_dates = [ 'date', 'modified', 'date_gmt', 'modified_gmt' ];

	/**
	 * Mixin for all content that is time stamped.
	 *
	 * @type {{toJSON: toJSON, parse: parse}}.
	 */
	var TimeStampedMixin = {
		/**
		 * Serialize the entity pre-sync.
		 *
		 * @returns {*}.
		 */
		toJSON: function() {
			var attributes = _.clone( this.attributes );

			// Serialize Date objects back into 8601 strings.
			_.each( parseable_dates, function( key ) {
				if ( key in attributes ) {
					attributes[key] = attributes[key].toISOString();
				}
			});

			return attributes;
		},

		/**
		 * Unserialize the fetched response.
		 *
		 * @param {*} response.
		 * @returns {*}.
		 */
		parse: function( response ) {

			// Parse dates into native Date objects.
			_.each( parseable_dates, function ( key ) {
				if ( ! ( key in response ) ) {
					return;
				}

				var timestamp = wp.api.utils.parseISO8601( response[key] );
				response[key] = new Date( timestamp );
			});

			// Parse the author into a User object.
			if ( 'undefined' !== typeof response.author ) {
				response.author = new wp.api.models.User( response.author );
			}

			return response;
		}
	};

	/**
	 * Mixin for all hierarchical content types such as posts.
	 *
	 * @type {{parent: parent}}.
	 */
	var HierarchicalMixin = {
		/**
		 * Get parent object.
		 *
		 * @returns {Backbone.Model}
		 */
		parent: function() {

			var object, parent = this.get( 'parent' );

			// Return null if we don't have a parent.
			if ( parent === 0 ) {
				return null;
			}

			var parentModel = this;

			if ( 'undefined' !== typeof this.parentModel ) {
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

				// Otherwise, get the object directly.
				object = new parentModel.constructor( {
					id: parent
				});

				// Note that this acts asynchronously.
				object.fetch();

				return object;
			}
		}
	};

	/**
	 * Private Backbone base model for all models.
	 */
	var BaseModel = Backbone.Model.extend(
		/** @lends BaseModel.prototype  */
		{
			/**
			 * Set nonce header before every Backbone sync.
			 *
			 * @param {string} method.
			 * @param {Backbone.Model} model.
			 * @param {{beforeSend}, *} options.
			 * @returns {*}.
			 */
			sync: function( method, model, options ) {
				options = options || {};

				if ( 'undefined' !== typeof WP_API_Settings.nonce ) {
					var beforeSend = options.beforeSend;

					options.beforeSend = function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', WP_API_Settings.nonce );

						if ( beforeSend ) {
							return beforeSend.apply( this, arguments );
						}
					};
				}

				return Backbone.sync( method, model, options );
			}
		}
	);

	/**
	 * Backbone model for single users.
	 */
	wp.api.models.User = BaseModel.extend(
		/** @lends User.prototype  */
		{
			idAttribute: 'id',

			urlRoot: WP_API_Settings.root + 'wp/v2/users',

			defaults: {
				id: null,
				avatar_url: {},
				capabilities: {},
				description: '',
				email: '',
				extra_capabilities: {},
				first_name: '',
				last_name: '',
				link: '',
				name: '',
				nickname: '',
				registered_date: new Date(),
				roles: [],
				slug: '',
				url: '',
				username: '',
				_links: {}
			}
		}
	);

	/**
	 * Model for Taxonomy.
	 */
	wp.api.models.Taxonomy = BaseModel.extend(
		/** @lends Taxonomy.prototype  */
		{
			idAttribute: 'slug',

			urlRoot: WP_API_Settings.root + 'wp/v2/taxonomies',

			defaults: {
				name: '',
				slug: null,
				description: '',
				labels: {},
				types: [],
				show_cloud: false,
				hierarchical: false
			}
		}
	);

	/**
	 * Backbone model for term.
	 */
	wp.api.models.Term = BaseModel.extend(
		/** @lends Term.prototype */
		{
			idAttribute: 'id',

			/**
			 * Return URL for the model.
			 *
			 * @returns {string}
			 */
			url: function() {
				var id = this.get( 'id' );
				id = id || '';

				return WP_API_Settings.root + 'wp/v2/taxonomies/' + this.get( 'taxonomy' ) + '/terms/' + id;
			},

			defaults: {
				id: null,
				name: '',
				slug: '',
				description: '',
				parent: null,
				count: 0,
				link: '',
				taxonomy: '',
				_links: {}
			}

		}
	);

	/**
	 * Backbone model for single posts.
	 */
	wp.api.models.Post = BaseModel.extend( _.extend(
		/** @lends Post.prototype  */
		{
			idAttribute: 'id',

			urlRoot: WP_API_Settings.root + 'wp/v2/posts',

			defaults: {
				id: null,
				date: new Date(),
				date_gmt: new Date(),
				guid: {},
				link: '',
				modified: new Date(),
				modified_gmt: new Date(),
				password: '',
				slug: '',
				status: 'draft',
				type: 'post',
				title: {},
				content: {},
				author: null,
				excerpt: {},
				featured_image: null,
				comment_status: 'open',
				ping_status: 'open',
				sticky: false,
				format: 'standard',
				_links: {}
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for pages.
	 */
	wp.api.models.Page = BaseModel.extend( _.extend(
		/** @lends Page.prototype  */
		{
			idAttribute: 'id',

			urlRoot: WP_API_Settings.root + 'wp/v2/pages',

			defaults: {
				id: null,
				date: new Date(),
				date_gmt: new Date(),
				guid: {},
				link: '',
				modified: new Date(),
				modified_gmt: new Date(),
				password: '',
				slug: '',
				status: 'draft',
				type: 'page',
				title: {},
				content: {},
				author: null,
				excerpt: {},
				featured_image: null,
				comment_status: 'closed',
				ping_status: 'closed',
				menu_order: null,
				template: '',
				_links: {}
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for revisions.
	 */
	wp.api.models.Revision = BaseModel.extend( _.extend(
		/** @lends Revision.prototype */
		{
			idAttribute: 'id',

			/**
			 * Return URL for the model.
			 *
			 * @returns {string}.
			 */
			url: function() {
				var id = this.get( 'id' ) || '';

				return WP_API_Settings.root + 'wp/v2/posts/' + id + '/revisions';
			},

			defaults: {
				id: null,
				author: null,
				date: new Date(),
				date_gmt: new Date(),
				guid: {},
				modified: new Date(),
				modified_gmt: new Date(),
				parent: 0,
				slug: '',
				title: {},
				content: {},
				excerpt: {},
				_links: {}
			}

		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for media items.
	 */
	wp.api.models.Media = BaseModel.extend( _.extend(
		/** @lends Media.prototype */
		{
			idAttribute: 'id',

			urlRoot: WP_API_Settings.root + 'wp/v2/media',

			defaults: {
				id: null,
				date: new Date(),
				date_gmt: new Date(),
				guid: {},
				link: '',
				modified: new Date(),
				modified_gmt: new Date(),
				password: '',
				slug: '',
				status: 'draft',
				type: 'attachment',
				title: {},
				author: null,
				comment_status: 'open',
				ping_status: 'open',
				alt_text: '',
				caption: '',
				description: '',
				media_type: '',
				media_details: {},
				post: null,
				source_url: '',
				_links: {}
			},

			/**
			 * @class Represent a media item.
			 * @augments Backbone.Model.
			 * @constructs
			 */
			initialize: function() {

				// Todo: what of the parent model is a page?
				this.parentModel = wp.api.models.Post;
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for comments.
	 */
	wp.api.models.Comment = BaseModel.extend( _.extend(
		/** @lends Comment.prototype */
		{
			idAttribute: 'id',

			defaults: {
				id: null,
				author: null,
				author_email: '',
				author_ip: '',
				author_name: '',
				author_url: '',
				author_user_agent: '',
				content: {},
				date: new Date(),
				date_gmt: new Date(),
				karma: 0,
				link: '',
				parent: 0,
				post: null,
				status: 'hold',
				type: '',
				_links: {}
			},

			/**
			 * Return URL for model.
			 *
			 * @returns {string}.
			 */
			url: function() {
				var post_id = this.get( 'post' );
				post_id = post_id || '';

				var id = this.get( 'id' );
				id = id || '';

				return WP_API_Settings.root + 'wp/v2/posts/' + post_id + '/comments/' + id;
			}
		}, TimeStampedMixin, HierarchicalMixin )
	);

	/**
	 * Backbone model for single post types.
	 */
	wp.api.models.PostType = BaseModel.extend(
		/** @lends PostType.prototype */
		{
			idAttribute: 'slug',

			urlRoot: WP_API_Settings.root + 'wp/v2/posts/types',

			defaults: {
				slug: null,
				name: '',
				description: '',
				labels: {},
				hierarchical: false
			},

			/**
			 * Prevent model from being saved.
			 *
			 * @returns {boolean}.
			 */
			save: function() {
				return false;
			},

			/**
			 * Prevent model from being deleted.
			 *
			 * @returns {boolean}.
			 */
			'delete': function() {
				return false;
			}
		}
	);

	/**
	 * Backbone model for a post status.
	 */
	wp.api.models.PostStatus = BaseModel.extend(
		/** @lends PostStatus.prototype */
		{
			idAttribute: 'slug',

			urlRoot: WP_API_Settings.root + 'wp/v2/posts/statuses',

			defaults: {
				slug: null,
				name: '',
				'public': true,
				'protected': false,
				'private': false,
				queryable: true,
				show_in_list: true,
				_links: {}
			},

			/**
			 * Prevent model from being saved.
			 *
			 * @returns {boolean}.
			 */
			save: function() {
				return false;
			},

			/**
			 * Prevent model from being deleted.
			 *
			 * @returns {boolean}.
			 */
			'delete': function() {
				return false;
			}
		}
	);

})( wp, WP_API_Settings, Backbone, window );
