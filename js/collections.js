( function( wp, WP_API_Settings, Backbone, window ) {

    "use strict";

    /**
     * wp.api.collections.Posts
     */
    wp.api.collections.Posts = Backbone.Collection.extend( {
        url: WP_API_Settings.root + "/posts",

        model: wp.api.models.Post
    });

    /**
     * Backbone users collection
     */
    wp.api.collections.Users = Backbone.Collection.extend( {
        url: WP_API_Settings.root + "/users",

        model: wp.api.models.User
    });

    /**
     * Backbone taxonomy collection
     */
    wp.api.collections.Taxonomies = Backbone.Collection.extend( {
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

} )( wp, WP_API_Settings, Backbone, window, undefined );