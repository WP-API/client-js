( function( wp, WP_API_Settings, Backbone, window ) {

    "use strict";

    /**
     * wp.api.collections.Posts
     */
    wp.api.collections.Posts = Backbone.Collection.extend({
        url: WP_API_Settings.root + "/posts",

        model: wp.api.models.Post
    });

} )( wp, WP_API_Settings, Backbone, window, undefined );