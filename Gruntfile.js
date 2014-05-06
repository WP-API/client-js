module.exports = function ( grunt ) {
    grunt.initConfig( {
        pkg : grunt.file.readJSON( 'package.json' ),
        concat : {
            js : {
                src : [
                    'js/*'
                ],
                dest : 'build/js/wp-api.js'
            }
        },
        uglify : {
            js : {
                files : {
                    'build/js/wp-api.min.js' : [ 'build/js/wp-api.js' ]
                }
            }
        },
        watch : {
			files : [
                'js/app.js',
                'js/models.js',
                'js/views.js',
                'js/collections.js'
            ],
			tasks : [ 'concat', 'uglify' ]
		}
    });
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.registerTask( 'default', [ 'concat:js', 'uglify:js' ] );
};