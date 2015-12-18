/* jshint node:true */
module.exports = function( grunt ) {
	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		jshint: {
			options: grunt.file.readJSON( '.jshintrc' ),
			grunt: {
				src: [ 'Gruntfile.js' ]
			},
			tests: {
				src: [
					'tests/**/*.js'
				],
				options: grunt.file.readJSON( 'tests/.jshintrc' )
			},
			core: {
				src: [
					'js/*.js'
				]
			}
		},
		uglify: {
			js: {
				options: {
					sourceMap: true
				},
				files: {
					'build/js/wp-api.min.js': [
						'js/app.js',
						'js/utils.js',
						'js/models.js',
						'js/views.js',
						'js/collections.js',
						'js/load.js'
					]
				}
			}
		},
		concat: {
			js: {
				src: [
					'js/app.js',
					'js/utils.js',
					'js/models.js',
					'js/views.js',
					'js/collections.js',
					'js/load.js'
				],
				dest: 'build/js/wp-api.js'
			}
		},
		qunit: {
			all: [ 'tests/*.html' ]
		},
		explainjs: {
			files: {
				src: ['build/js/wp-api.js'],
				dest: 'build/docs/index.html'
			}
		},
		watch: {
			files: [
				'js/*.js'
			],
			tasks: [ 'jshint', 'uglify:js', 'concat:js' ]
		}
	});
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.loadNpmTasks( 'grunt-explainjs' );
	grunt.registerTask( 'default', [ 'jshint', 'uglify:js', 'concat:js', 'explainjs' ] );
	grunt.registerTask( 'test', [ 'qunit:all' ] );
};
