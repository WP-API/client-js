/* global wpApiSettings:false */

// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, wpApiSettings, Backbone, window, undefined ) {

	'use strict';

	/**
	 * Array of parseable dates.
	 *
	 * @type {string[]}.
	 */
	var parseableDates = [ 'date', 'modified', 'date_gmt', 'modified_gmt' ],

	/**
	 * Mixin for all content that is time stamped.
	 *
	 * @type {{toJSON: toJSON, parse: parse}}.
	 */
	TimeStampedMixin = {
		/**
		 * Serialize the entity pre-sync.
		 *
		 * @returns {*}.
		 */
		toJSON: function() {
			var attributes = _.clone( this.attributes );

			// Serialize Date objects back into 8601 strings.
			_.each( parseableDates, function( key ) {
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
			var timestamp;

			// Parse dates into native Date objects.
			_.each( parseableDates, function( key ) {
				if ( ! ( key in response ) ) {
					return;
				}

				timestamp = wp.api.utils.parseISO8601( response[key] );
				response[key] = new Date( timestamp );
			});

			// Parse the author into a User object.
			if ( 'undefined' !== typeof response.author ) {
				response.author = new wp.api.models.User( response.author );
			}

			return response;
		}
	},

	/**
	 * Mixin for all hierarchical content types such as posts.
	 *
	 * @type {{parent: parent}}.
	 */
	HierarchicalMixin = {
		/**
		 * Get parent object.
		 *
		 * @returns {Backbone.Model}
		 */
		parent: function() {

			var object,
				parent      = this.get( 'parent' ),
				parentModel = this;

			// Return null if we don't have a parent.
			if ( 0 === parent ) {
				return null;
			}

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
				var beforeSend;

				options = options || {};

				if ( ! _.isUndefined( wpApiSettings.nonce ) && ! _.isNull( wpApiSettings.nonce ) ) {
					beforeSend = options.beforeSend;

					// @todo enable option for jsonp endpoints
					// options.dataType = 'jsonp';

					options.beforeSend = function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', wpApiSettings.nonce );

						if ( beforeSend ) {
							return beforeSend.apply( this, arguments );
						}
					};
				}

				return Backbone.sync( method, model, options );
			},

			/**
			 * Save is only allowed when the PUT OR POST methods are available for the endpoint.
			 */
			save: function( attrs, options ) {

				// Do we have the put method, then execute the save.
				if ( _.contains( this.methods, 'PUT' ) || _.contains( this.methods, 'POST' ) ) {

					// Proxy the call to the original save function.
					return Backbone.Model.prototype.save.call( this, attrs, options );
				} else {

					// Otherwise bail, disallowing action.
					return false;
				}
			},

			/**
			 * Delete is only allowed when the DELETE method is available for the endpoint.
			 */
			destroy: function( options ) {

				// Do we have the DELETE method, then execute the destroy.
				if ( _.contains( this.methods, 'DELETE' ) ) {

					// Proxy the call to the original save function.
					return Backbone.Model.prototype.destroy.call( this, options );
				} else {

					// Otherwise bail, disallowing action.
					return false;
				}
			}

		}
	);

	/**
	 * API Schema model. Contains meta information about the API.
	 */
	wp.api.models.Schema = wp.api.WPApiBaseModel.extend(
		/** @lends Shema.prototype  */
		{
			url: function() {
				return wpApiSettings.root + wp.api.versionString;
			}
		}
	);
})( wp, wpApiSettings, Backbone, window );
