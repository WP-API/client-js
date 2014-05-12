( function( wp, WP_API_Settings, Backbone, window, undefined ) {

    "use strict";

    var parseable_dates = [ 'date', 'modified' ];

    /**
     * Backbone model for single users
     *
     * @type {*}
     */
    wp.api.models.User = Backbone.Model.extend( {
        idAttribute: "ID",

        urlRoot: WP_API_Settings.root + "/users",

        defaults: {
            ID: null,
            username: "",
            email: "",
            password: "",
            name: "",
            first_name: "",
            last_name: "",
            nickname: "",
            slug: "",
            URL: "",
            avatar: "",
            meta: {
                links: {}
            }
        },

        avatar: function( size ) {
            return this.get( 'avatar' ) + '&s=' + size;
        }
    });

    /**
     * Model for taxonomy
     */
    wp.api.models.Taxonomy = Backbone.Model.extend( {
        idAttribute: "name",

        defaults: {
            name: null,
            slug: '',
            labels: [],
            types: [ 'post' ],
            show_cloud: false,
            hierarchical: false,
            meta: {
                links: {}
            }
        },

        url: function() {
            var name = this.get( 'name' );
            name = name || "";

            return WP_API_Settings.root + '/posts/types/' + this.defaultPostType() + '/taxonomies/' + name;
        },

        /**
         * Use the first post type as the default one
         *
         * @return string
         */
        defaultPostType: function() {
            var types = this.get( 'types');

            if ( typeof types !== 'undefined' && types[0] ) {
                return types[0];
            }

            return null;
        }
    });

    /**
     * Backbone model for term
     */

    wp.api.models.Term = Backbone.Model.extend( {

        idAttribute: 'ID',

        type: 'post',

        taxonomy: 'category',

        initialize: function( attributes, options ) {
            if ( typeof options != 'undefined' ) {
                if ( options.type ) {
                    this.type = options.type;
                }

                if ( options.taxonomy ) {
                    this.taxonomy = options.taxonomy;
                }
            }
        },

        url: function() {
            var id = this.get( 'ID' );
            id = id || "";

            return WP_API_Settings.root + '/posts/types/' + this.type + '/taxonomies/' + this.taxonomy + '/terms/' + id;
        },

        defaults: {
            ID: null,
            name: '',
            slug: '',
            description: '',
            parent: null,
            count: 0,
            link: '',
            meta: {
                links: {}
            }
        }

    });


    /**
     * Backbone model for single posts
     *
     * @type {*}
     */
    wp.api.models.Post = Backbone.Model.extend( {

        idAttribute: "ID",

        urlRoot: WP_API_Settings.root + "/posts",

        defaults: function() {
            return {
                ID: null,
                title:          "",
                status:         "draft",
                type:           "post",
                author:         new wp.api.models.User(),
                content:        "",
                link:           "",
                "parent":       0,
                date:           new Date(),
                // date_gmt:       new Date(),
                modified:       new Date(),
                // modified_gmt:   new Date(),
                format:         "standard",
                slug:           "",
                guid:           "",
                excerpt:        "",
                menu_order:     0,
                comment_status: "open",
                ping_status:    "open",
                sticky:         false,
                date_tz:        "Etc/UTC",
                modified_tz:    "Etc/UTC",
                terms:          {},
                post_meta:      {},
                meta: {
                    links: {}
                }
            }
        },

        /**
         * Serialize the entity
         *
         * Overriden for correct date handling
         * @return {!Object} Serializable attributes
         */
        toJSON: function () {
            var attributes = _.clone( this.attributes );

            // Remove GMT dates in favour of our native Date objects
            // The API only requires one of `date` and `date_gmt`, so this is
            // safe for use.
            delete attributes.date_gmt;
            delete attributes.modified_gmt;

            // Serialize Date objects back into 8601 strings
            _.each( parseable_dates, function ( key ) {
                attributes[ key ] = attributes[ key ].toISOString();
            });

            return attributes;
        },

        /**
         * Unserialize the entity
         *
         * Overriden for correct date handling
         * @param {!Object} response Attributes parsed from JSON
         * @param {!Object} options Request options
         * @return {!Object} Fully parsed attributes
         */
        parse: function ( response, options ) {
            // Parse dates into native Date objects
            _.each( parseable_dates, function ( key ) {
                if ( ! ( key in response ) )
                    return;

                var timestamp = wp.api.utils.parseISO8601( response[ key ] );
                response[ key ] = new Date( timestamp );
            });

            // Remove GMT dates in favour of our native Date objects
            delete response.date_gmt;
            delete response.modified_gmt;

            // Parse the author into a User object
            response.author = new wp.api.models.User( { username: response.author } );

            return response;
        },

        /**
         * Get parent post
         *
         * @return {wp.api.models.Post} Parent post, null if not found
         */
        parent: function() {
            var parent = this.get( 'parent' );

            // Return null if we don't have a parent
            if ( parent === 0 ) {
                return null;
            }

            // Can we get this from its collection?
            if ( this.collection ) {
                return this.collection.get(parent);
            }
            else {
                // Otherwise, get the post directly
                var post = new wp.api.Models.Post({
                    id: parent
                });

                // Note that this acts asynchronously
                wp.api.models.post.fetch();
                return post;
            }
        }
    });

} )( wp, WP_API_Settings, Backbone, window );