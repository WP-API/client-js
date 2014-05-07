( function( window, undefined ) {

    "use strict";

    function WP_API() {
        this.models = {};
        this.collections = {};
        this.views = {};
    }

    window.wp = window.wp || {};
    wp.api = wp.api || new WP_API();

} )( window );