module.exports = function( grunt ) {
	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
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
						'js/collections.js'
					]
				}
			}
		},
		qunit: {
			all: [ 'tests/*.html' ]
		},
		watch: {
			files: [
				'js/*.js'
			],
			tasks: [ 'uglify' ]
		}
	});
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.registerTask( 'default', [ 'uglify:js' ] );
	grunt.registerTask( 'test', [ 'qunit:all' ] );
};
