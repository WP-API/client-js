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

})( wp, WP_API_Settings, Backbone, _, window );
