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

		url: WP_API_Settings.root + '/taxonomies'
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

		parent: null,

		initialize: function( models, options ) {
			if ( options && options.parent ) {
				this.parent = options.parent;
			}
		},

		url: function() {
			return WP_API_Settings.root + '/posts/' + this.parent + '/revisions';
		}
	});

})( wp, WP_API_Settings, Backbone, _, window );
