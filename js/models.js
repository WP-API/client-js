/* global wpApiSettings:false */

// Suppress warning about parse function's unused "options" argument:
/* jshint unused:false */
(function( wp, wpApiSettings, Backbone, window, undefined ) {

	'use strict';

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

				// Add '?force=true' to delete method when required.
				if ( this.requireForceForDelete && 'delete' === method ) {
					model.url = model.url() + '?force=true';
				}
				return Backbone.sync( method, model, options );
			},

			/**
			 * Save is only allowed when the PUT OR POST methods are available for the endpoint.
			 */
			save: function( attrs, options ) {

				// Do we have the put method, then execute the save.
				if ( _.includes( this.methods, 'PUT' ) || _.includes( this.methods, 'POST' ) ) {

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
				if ( _.includes( this.methods, 'DELETE' ) ) {

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
		/** @lends Schema.prototype  */
		{
			defaults: {
				_links: {},
				namespace: null,
				routes: {}
			},

			initialize: function( attributes, options ) {
				var model = this;
				options = options || {};

				wp.api.WPApiBaseModel.prototype.initialize.call( model, attributes, options );

				model.apiRoot = options.apiRoot || wpApiSettings.root;
				model.versionString = options.versionString || wpApiSettings.versionString;
			},

			url: function() {
				return this.apiRoot + this.versionString;
			}
		}
	);
})( wp, wpApiSettings, Backbone, window );
