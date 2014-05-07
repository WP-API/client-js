module.exports = function ( grunt ) {
    grunt.initConfig( {
        pkg : grunt.file.readJSON( 'package.json' ),
        concat : {
            js : {
                src : [
                    'js/app.js',
                    'js/utils.js',
                    'js/models.js',
                    'js/views.js',
                    'js/collections.js'
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
        qunit: {
            all: [ 'tests/*.html' ]
        },
        watch : {
			files : [
                'js/*.js'
            ],
			tasks : [ 'concat', 'uglify' ]
		}
    });
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks( 'grunt-contrib-qunit' );
    grunt.registerTask( 'default', [ 'concat:js', 'uglify:js' ] );
    grunt.registerTask( 'qunit', [ 'qunit:all' ] );
};