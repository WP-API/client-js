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
     * @type {*}
     */
    wp.api.collections.Users = Backbone.Collection.extend( {
        url: WP_API_Settings.root + "/users",

        model: wp.api.models.User
    });

} )( wp, WP_API_Settings, Backbone, window, undefined );