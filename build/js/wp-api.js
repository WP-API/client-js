(function( window, undefined ) {

	'use strict';

	function WP_API() {
		this.models = {};
		this.collections = {};
		this.views = {};
	}

	window.wp = window.wp || {};
	wp.api = wp.api || new WP_API();

})( window );

(function( window, undefined ) {

	'use strict';

	// ECMAScript 5 shim, from MDN
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
	if ( ! Date.prototype.toISOString ) {
		var pad = function( number ) {
			var r = String( number );
			if ( r.length === 1 ) {
				r = '0' + r;
			}
			return r;
		};

		Date.prototype.toISOString = function() {
			return this.getUTCFullYear() +
				'-' + pad( this.getUTCMonth() + 1 ) +
				'-' + pad( this.getUTCDate() ) +
				'T' + pad( this.getUTCHours() ) +
				':' + pad( this.getUTCMinutes() ) +
				':' + pad( this.getUTCSeconds() ) +
				'.' + String( ( this.getUTCMilliseconds()/1000 ).toFixed( 3 ) ).slice( 2, 5 ) +
				'Z';
		};
	}

	function WP_API_Utils() {
		var origParse = Date.parse,
			numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];


		this.parseISO8601 = function( date ) {
			var timestamp, struct, i, k,
				minutesOffset = 0;

			// ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
			// before falling back to any implementation-specific date parsing, so that’s what we do, even if native
			// implementations could be faster
			//              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
			if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
				// avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
				for ( i = 0; ( k = numericKeys[i] ); ++i) {
					struct[k] = +struct[k] || 0;
				}

				// allow undefined days and months
				struct[2] = ( +struct[2] || 1 ) - 1;
				struct[3] = +struct[3] || 1;

				if ( struct[8] !== 'Z' && struct[9] !== undefined ) {
					minutesOffset = struct[10] * 60 + struct[11];

					if ( struct[9] === '+' ) {
						minutesOffset = 0 - minutesOffset;
					}
				}

				timestamp = Date.UTC( struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7] );
			}
			else {
				timestamp = origParse ? origParse( date ) : NaN;
			}

			return timestamp;
		};
	}

	window.wp = window.wp || {};
	wp.api = wp.api || {};
	wp.api.utils = wp.api.utils || new WP_API_Utils();

})( window );

/* global WP_API_Settings:false */
// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, WP_API_Settings, Backbone, window, undefined ) {

	'use strict';

	var parseable_dates = [ 'date', 'modified' ];

	/**
	 * Backbone base model for sending nonces with requests
	 */
	wp.api.models.Base = Backbone.Model.extend( {
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
	});

	/**
	 * Backbone model for single users
	 *
	 * @type {*}
	 */
	wp.api.models.User = wp.api.models.Base.extend( {
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

		avatar: function( size ) {
			return this.get( 'avatar' ) + '&s=' + size;
		}
	});

	/**
	 * Backbone model for a post status
	 */
	wp.api.models.PostStatus = wp.api.models.Base.extend( {
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
		 * This model is read only
		 */
		save: function() {
			return false;
		},

		'delete': function() {
			return false;
		}
	});

	/**
	 * Model for taxonomy
	 */
	wp.api.models.Taxonomy = wp.api.models.Base.extend({
		idAttribute: 'name',

		defaults: {
			name: null,
			slug: '',
			labels: [],
			types: [ 'post' ],
			show_cloud: false,
			hierarchical: false,
			meta: {
				links: {}
			}
		},

		url: function() {
			var name = this.get( 'name' );
			name = name || '';

			return WP_API_Settings.root + '/posts/types/' + this.defaultPostType() + '/taxonomies/' + name;
		},

		/**
		 * Use the first post type as the default one
		 *
		 * @return string
		 */
		defaultPostType: function() {
			var types = this.get( 'types');

			if ( typeof types !== 'undefined' && types[0] ) {
				return types[0];
			}

			return null;
		}
	});

	/**
	 * Backbone model for term
	 */

	wp.api.models.Term = wp.api.models.Base.extend({

		idAttribute: 'ID',

		type: 'post',

		taxonomy: 'category',

		initialize: function( attributes, options ) {
			if ( typeof options !== 'undefined' ) {
				if ( options.type ) {
					this.type = options.type;
				}

				if ( options.taxonomy ) {
					this.taxonomy = options.taxonomy;
				}
			}
		},

		url: function() {
			var id = this.get( 'ID' );
			id = id || '';

			return WP_API_Settings.root + '/posts/types/' + this.type + '/taxonomies/' + this.taxonomy + '/terms/' + id;
		},

		parent: function() {
			var term,
				parent = this.get( 'parent' );

			// Return null if we don't have a parent
			if ( parent === 0 ) {
				return null;
			}

			// Can we get this from its collection?
			if ( this.collection ) {
				return this.collection.get( parent );
			} else {
				// Otherwise, get the post directly
				term = new wp.api.models.Term( {
					ID: parent
				});

				// Note that this acts asynchronously
				term.fetch();
				return term;
			}
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

	});

	/**
	 * Backbone model for single posts
	 *
	 * @type {*}
	 */
	wp.api.models.Post = wp.api.models.Base.extend( {

		idAttribute: 'ID',

		urlRoot: WP_API_Settings.root + '/posts',

		defaults: function() {
			return {
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
				terms: {},
				post_meta: {},
				meta: {
					links: {}
				}
			};
		},

		/**
		 * Serialize the entity
		 *
		 * Overriden for correct date handling
		 * @return {!Object} Serializable attributes
		 */
		toJSON: function() {
			var attributes = _.clone( this.attributes );

			// Serialize Date objects back into 8601 strings
			_.each( parseable_dates, function ( key ) {
				attributes[key] = attributes[key].toISOString();
			});

			return attributes;
		},

		/**
		 * Unserialize the entity
		 *
		 * Overriden for correct date handling
		 * @param {!Object} response Attributes parsed from JSON
		 * @param {!Object} options Request options
		 * @return {!Object} Fully parsed attributes
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
			response.author = new wp.api.models.User( response.author );

			return response;
		},

		/**
		 * Get parent post
		 *
		 * @return {wp.api.models.Post} Parent post, null if not found
		 */
		parent: function() {

			var post,
				parent = this.get( 'parent' );

			// Return null if we don't have a parent
			if ( parent === 0 ) {
				return null;
			}

			// Can we get this from its collection?
			if ( this.collection ) {
				return this.collection.get( parent );
			} else {
				// Otherwise, get the post directly
				post = new this.constructor( {
					ID: parent
				});

				// Note that this acts asynchronously
				post.fetch();
				return post;
			}
		}
	});

	/**
	 * Backbone model for pages
	 */
	wp.api.models.Page = wp.api.models.Post.extend( {
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
	});

	/**
	 * Backbone model for pages
	 */
	wp.api.models.Revision = wp.api.models.Post.extend( {
		url: function() {
			var parent_id = this.get( 'parent' );
			parent_id = parent_id || '';

			return WP_API_Settings.root + '/posts/' + parent_id + '/revisions/';
		}

	});

	/**
	 * Backbone model for media items
	 */
	wp.api.models.Media = wp.api.models.Post.extend( {
		idAttribute: 'ID',

		urlRoot: WP_API_Settings.root + '/media',

		defaults: {
			ID: null,
			title: '',
			status: 'inherit',
			type: 'attachment',
			author: {},
			content: '',
			parent: 0,
			link: '',
			date: new Date(),
			modified: new Date(),
			date_gmt: new Date(),
			modified_gmt: new Date(),
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
			meta: {
				links: {}
			},
			terms: [],
			source: '',
			is_image: true,
			attachment_meta: {}
		}
	});

	/**
	 * Backbone model for comments
	 */
	wp.api.models.Comment = wp.api.models.Base.extend( {
		idAttribute: 'ID',

		defaults: {
			ID: null,
			post: null,
			content: '',
			status: 'approved',
			type: 'comment',
			parent: 0,
			author: new wp.api.models.User(),
			date: new Date(),
			date_gmt: new Date(),
			date_tz: 'Etc/UTC',
			meta: {
				links: {}
			}
		},

		url: function() {
			var post_id = this.get( 'post' );
			post_id = post_id || '';

			var id = this.get( 'ID' );
			id = id || '';

			return WP_API_Settings.root + '/posts/' + post_id + '/comments/' + id;
		},

		parse: function( response ) {
			_.each( parseable_dates, function ( key ) {
				if ( ! ( key in response ) ) {
					return;
				}

				var timestamp = wp.api.utils.parseISO8601( response[key] );
				response[key] = new Date( timestamp );
			});

			// Parse the author into a User object
			response.author = new wp.api.models.User( { username: response.author } );

			return response;
		},

		toJSON: function() {
			var attributes = _.clone( this.attributes );

			// Serialize Date objects back into 8601 strings
			_.each( parseable_dates, function ( key ) {
				attributes[key] = attributes[key].toISOString();
			});

			return attributes;
		},

		parent: function() {
			var comment,
				parent = this.get( 'parent' );

			// Return null if we don't have a parent
			if ( parent === 0 ) {
				return null;
			}

			// Can we get this from its collection?
			if ( this.collection ) {
				return this.collection.get(parent);
			} else {
				// Otherwise, get the post directly
				comment = new wp.api.models.Comment({
					ID: parent
				});

				// Note that this acts asynchronously
				comment.fetch();
				return comment;
			}
		}
	});

	/**
	 * Backbone model for single post types
	 */
	wp.api.models.PostType = wp.api.models.Base.extend( {
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
		 * This is a read only model
		 *
		 * @returns {boolean}
		 */
		save: function () {
			return false;
		},

		'delete': function () {
			return false;
		}
	});

})( wp, WP_API_Settings, Backbone, window );

/* global WP_API_Settings:false */
(function( wp, WP_API_Settings, Backbone, _, window, undefined ) {

	'use strict';

	/**
	 * wp.api.collections.Posts
	 */
	wp.api.collections.Posts = Backbone.Collection.extend({
		url: WP_API_Settings.root + '/posts',

		model: wp.api.models.Post
	});

	/**
	 * Backbone collection for pages
	 */
	wp.api.collections.Pages = Backbone.Collection.extend({
		url: WP_API_Settings.root + '/pages',

		model: wp.api.models.Page
	});

	/**
	 * Backbone users collection
	 */
	wp.api.collections.Users = Backbone.Collection.extend({
		url: WP_API_Settings.root + '/users',

		model: wp.api.models.User
	});

	/**
	 * Backbone post statuses collection
	 */
	wp.api.collections.PostStatuses = Backbone.Collection.extend({
		url: WP_API_Settings.root + '/posts/statuses',

		model: wp.api.models.PostStatus

	});

	/**
	 * Backbone media library collection
	 */
	wp.api.collections.MediaLibrary = Backbone.Collection.extend({
		url: WP_API_Settings.root + '/media',

		model: wp.api.models.Media
	});

	/**
	 * Backbone taxonomy collection
	 */
	wp.api.collections.Taxonomies = Backbone.Collection.extend({
		model: wp.api.models.Taxonomy,

		type: 'post',

		initialize: function( models, options ) {
			if ( options && options.type ) {
				this.type = options.type;
			}
		},

		url: function() {
			return WP_API_Settings.root + '/posts/types/' + this.type + '/taxonomies/';
		}
	});

	/**
	 * Backbone comment collection
	 */
	wp.api.collections.Comments = Backbone.Collection.extend({
		model: wp.api.models.Comment,

		post: null,

		initialize: function( models, options ) {
			if ( options && options.post ) {
				this.post = options.post;
			}
		},

		url: function() {
			return WP_API_Settings.root + '/posts/' + this.post + '/comments';
		}
	});

	/**
	 * Backbone post type collection
	 */
	wp.api.collections.PostTypes = Backbone.Collection.extend({
		model: wp.api.models.PostType,

		url: WP_API_Settings.root + '/posts/types'
	});

	/**
	 * Backbone terms collection
	 */
	wp.api.collections.Terms = Backbone.Collection.extend({
		model: wp.api.models.Term,

		type: 'post',

		taxonomy: 'category',

		initialize: function( models, options ) {
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

		addModel: function( model ) {
			model.type = this.type;
			model.taxonomy = this.taxonomy;
		},

		url: function() {
			return WP_API_Settings.root + '/posts/types/' + this.type + '/taxonomies/' + this.taxonomy + '/terms/';
		}
	});

	/**
	 * Backbone revisions collection
	 */
	wp.api.collections.Revisions = Backbone.Collection.extend( {
		model: wp.api.models.Revision,

		post: null,

		initialize: function( models, options ) {
			if ( options && options.post ) {
				this.post = options.post;
			}
		},

		url: function() {
			return WP_API_Settings.root + '/posts/' + this.post + '/revisions';
		}
	});

})( wp, WP_API_Settings, Backbone, _, window );
