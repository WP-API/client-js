( function( window, undefined ) {

    "use strict";

    function WP_API() {
        this.Models = {};
        this.Collections = {};
        this.Views = {};
    }

    window.wp = window.wp || {};
    wp.api = wp.api || new WP_API();

} )( window );


