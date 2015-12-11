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
	 * Backbone base model for all models.
	 */
	wp.api.WPApiBaseModel = Backbone.Model.extend(
		/** @lends WPApiBaseModel.prototype  */
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
	 * API Schema model. Contains meta information about the API.
	 */
	wp.api.models.Schema = wp.api.WPApiBaseModel.extend(
		/** @lends Shema.prototype  */
		{
			url: WP_API_Settings.root + 'wp/v2',

			defaults: {
				namespace: '',
				_links: '',
				routes: {}
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
			destroy: function() {
				return false;
			}
		}
	);


})( wp, WP_API_Settings, Backbone, window );
