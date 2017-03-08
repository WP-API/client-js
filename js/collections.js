( function() {

	'use strict';

	var wpApiSettings = window.wpApiSettings || {};

	/**
	 * Contains basic collection functionality such as pagination.
	 */
	wp.api.WPApiBaseCollection = Backbone.Collection.extend(
		/** @lends BaseCollection.prototype  */
		{

			/**
			 * Setup default state.
			 */
			initialize: function( models, options ) {
				this.state = {
					data: {},
					currentPage: null,
					totalPages: null,
					totalObjects: null
				};
				if ( _.isUndefined( options ) ) {
					this.parent = '';
				} else {
					this.parent = options.parent;
				}
			},

			/**
			 * Extend Backbone.Collection.sync to add nince and pagination support.
			 *
			 * Set nonce header before every Backbone sync.
			 *
			 * @param {string} method.
			 * @param {Backbone.Model} model.
			 * @param {{success}, *} options.
			 * @returns {*}.
			 */
			sync: function( method, model, options ) {
				var beforeSend, success,
					self = this;

				options    = options || {};
				beforeSend = options.beforeSend;

				// If we have a localized nonce, pass that along with each sync.
				if ( 'undefined' !== typeof wpApiSettings.nonce ) {
					options.beforeSend = function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', wpApiSettings.nonce );

						if ( beforeSend ) {
							return beforeSend.apply( self, arguments );
						}
					};
				}

				// When reading, add pagination data.
				if ( 'read' === method ) {
					if ( options.data ) {
						self.state.data = _.clone( options.data );

						delete self.state.data.page;
					} else {
						self.state.data = options.data = {};
					}

					if ( 'undefined' === typeof options.data.page ) {
						self.state.currentPage  = null;
						self.state.totalPages   = null;
						self.state.totalObjects = null;
					} else {
						self.state.currentPage = options.data.page - 1;
					}

					success = options.success;
					options.success = function( data, textStatus, request ) {
						if ( ! _.isUndefined( request ) ) {
							self.state.totalPages   = parseInt( request.getResponseHeader( 'x-wp-totalpages' ), 10 );
							self.state.totalObjects = parseInt( request.getResponseHeader( 'x-wp-total' ), 10 );
						}

						if ( null === self.state.currentPage ) {
							self.state.currentPage = 1;
						} else {
							self.state.currentPage++;
						}

						if ( success ) {
							return success.apply( this, arguments );
						}
					};
				}

				// Continue by calling Backbone's sync.
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

					if ( null === this.state.currentPage || this.state.currentPage <= 1 ) {
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
				if ( null === this.state.totalPages ||
					 null === this.state.totalObjects ||
					 null === this.state.currentPage ) {
					return null;
				} else {
					return ( this.state.currentPage < this.state.totalPages );
				}
			}
		}
	);

} )();
