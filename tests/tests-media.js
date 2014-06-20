var Backbone = Backbone || {};

( function() {

	module( 'Media Model Tests' );

	// Sample User Data
	var testUserData = {
		ID: 1,
		username: 'wordpress',
		email: 'generic@wordpress.org',
		password: '',
		name: 'WordPress',
		first_name: 'Word',
		last_name: 'Press',
		nickname: 'The WordPress\'er',
		slug: 'wordpress',
		URL: 'http://wordpress.org',
		avatar: 'http://s.w.org/style/images/wp-header-logo-2x.png?1'
	};

	// Sample Media Data.
	var testMediaData = {
		'ID': 1,
		'title': '143Construction-600&#215;400',
		'status': 'inherit',
		'type': 'attachment',
		'author': new wp.api.models.User( testUserData ),
		'content': '',
		'parent': 0,
		'link': 'http:\/\/example.com\/?attachment_id=2652',
		'date': new Date(),
		'modified': new Date(),
		'format': 'standard',
		'slug': '143construction-600x400',
		'guid': 'http:\/\/example.com\/wp-content\/uploads\/2014\/04\/143Construction-600x400.jpg',
		'excerpt': null,
		'menu_order': 0,
		'comment_status': 'open',
		'ping_status': 'open',
		'sticky': false,
		'date_tz': 'UTC',
		'date_gmt': new Date(),
		'modified_tz': 'UTC',
		'modified_gmt': new Date(),
		'meta': {
			'links': {
				'self': 'http:\/\/example.com\/wp-json\/media\/1',
				'author': 'http:\/\/example.com\/wp-json\/users\/1',
				'collection': 'http:\/\/example.com\/wp-json\/media',
				'replies': 'http:\/\/example.com\/wp-json\/media\/1\/comments',
				'version-history': 'http:\/\/example.com\/wp-json\/media\/1\/revisions'
			}
		},
		'terms': [],
		'source': 'http:\/\/example.com\/wp-content\/uploads\/2014\/04\/143Construction-600x400.jpg',
		'is_image': true,
		'attachment_meta': {
			'width': 600,
			'height': 400,
			'file': '2014\/04\/143Construction-600x400.jpg',
			'sizes': {
				'thumbnail': {
					'file': '143Construction-600x400-150x150.jpg',
					'width': 150,
					'height': 150,
					'mime-type': 'image\/jpeg',
					'url': 'http:\/\/example.com\/wp-content\/uploads\/2014\/04\/143Construction-600x400-150x150.jpg'
				},
				'medium': {
					'file': '143Construction-600x400-300x200.jpg',
					'width': 300,
					'height': 200,
					'mime-type': 'image\/jpeg',
					'url': 'http:\/\/example.com\/wp-content\/uploads\/2014\/04\/143Construction-600x400-300x200.jpg'
				},
				'post-thumbnail': {
					'file': '143Construction-600x400-600x270.jpg',
					'width': 600,
					'height': 270,
					'mime-type': 'image\/jpeg',
					'url': 'http:\/\/example.com\/wp-content\/uploads\/2014\/04\/143Construction-600x400-600x270.jpg'
				}
			},
			'image_meta': {
				'aperture': 8,
				'credit': '',
				'camera': 'NIKON D5000',
				'caption': '',
				'created_timestamp': 1322435644,
				'copyright': '',
				'focal_length': '18',
				'iso': '200',
				'shutter_speed': '0.004',
				'title': ''
			}
		}
	};

	var testMediaResponse = JSON.parse( '{"ID":1,"title":"143Construction-600&#215;400","status":"inherit","type":"attachment","author":{"ID":1,"username":"admin","name":"admin","first_name":"word","last_name":"press","nickname":"wordpress","slug":"admin","URL":"","avatar":"","description":"","registered":"2013-04-04T16:58:14+00:00","meta":{"links":{"self":"http://example.com/wp-json/users/1","archives":"http://example.com/wp-json/users/1/posts"}}},"content":"","parent":0,"link":"http://example.com/?attachment_id=2652","date":"2014-04-13T17:10:42+00:00","modified":"2014-04-13T17:10:42+00:00","format":"standard","slug":"143construction-600x400","guid":"http://example.com/wp-content/uploads/2014/04/143Construction-600x400.jpg","excerpt":null,"menu_order":0,"comment_status":"open","ping_status":"open","sticky":false,"date_tz":"UTC","date_gmt":"2014-04-13T17:10:42+00:00","modified_tz":"UTC","modified_gmt":"2014-04-13T17:10:42+00:00","meta":{"links":{"self":"http://example.com/wp-json/media/2652","author":"http://example.com/wp-json/users/1","collection":"http://example.com/wp-json/media","replies":"http://example.com/wp-json/media/2652/comments","version-history":"http://example.com/wp-json/media/2652/revisions"}},"terms":[],"source":"http://example.com/wp-content/uploads/2014/04/143Construction-600x400.jpg","is_image":true,"attachment_meta":{"width":600,"height":400,"file":"2014/04/143Construction-600x400.jpg","sizes":{"thumbnail":{"file":"143Construction-600x400-150x150.jpg","width":150,"height":150,"mime-type":"image/jpeg","url":"http://example.com/wp-content/uploads/2014/04/143Construction-600x400-150x150.jpg"},"medium":{"file":"143Construction-600x400-300x200.jpg","width":300,"height":200,"mime-type":"image/jpeg","url":"http://example.com/wp-content/uploads/2014/04/143Construction-600x400-300x200.jpg"},"post-thumbnail":{"file":"143Construction-600x400-600x270.jpg","width":600,"height":270,"mime-type":"image/jpeg","url":"http://example.com/wp-content/uploads/2014/04/143Construction-600x400-600x270.jpg"}},"image_meta":{"aperture":8,"credit":"","camera":"NIKON D5000","caption":"","created_timestamp":1322435644,"copyright":"","focal_length":"18","iso":"200","shutter_speed":"0.004","title":""}}}' );

	test( 'Media model can be instantiated with correct default values', function() {

		expect( 27 );

		// Instantiate Local Contact Backbone Model Object
		var media = new wp.api.models.Media();

		equal( media.get('ID'), null, 'Default ID should be null' );
		equal( media.get('title'), '', 'Default title should be empty' );
		equal( media.get('status'), 'inherit' , 'Default status should be inherit' );
		equal( media.get('type'), 'attachment', 'Default type should be attachment' );
		ok( media.get('author') instanceof Backbone.Model );
		equal( media.get('content'), '', 'Content should be empty' );
		equal( media.get('link'), '', 'Link should be empty' );
		equal( media.get('parent'), 0, 'Parent should be 0' );
		equal( Object.prototype.toString.call( media.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
		equal( Object.prototype.toString.call( media.get( 'date_gmt' ) ), '[object Date]', 'date_gmt should be object type Date' );
		equal( Object.prototype.toString.call( media.get('modified') ), '[object Date]', 'modified should be object type Date' );
		equal( Object.prototype.toString.call( media.get('modified_gmt') ), '[object Date]', 'modified_gmt should be object type Date' );

		equal( media.get('format'), 'standard', 'Format should be standard' );
		equal( media.get('slug'), '', 'Slug should be empty' );
		equal( media.get('guid'), '', 'guid should be empty' );
		equal( media.get('excerpt'), '', 'Excerpt should be empty' );
		equal( media.get('menu_order'), 0, 'menu_order should be 0' );
		equal( media.get('comment_status'), 'open', 'comment_status should be open' );
		equal( media.get('ping_status'), 'open', 'ping_status should be open' );
		equal( media.get('sticky'), false, 'sticky should be false' );
		equal( media.get('date_tz'), 'Etc/UTC', 'date_tz should be Etc/UTC' );
		equal( media.get('modified_tz'), 'Etc/UTC', 'modified_tz should be Etc/UTC' );
		equal( media.get('source'), '', 'Source should be empty' );
		equal( media.get('is_image'), true, 'Is image should be true' );
		deepEqual( media.get('terms'), [], 'terms should be an empty object' );
		deepEqual( media.get('image_meta'), {}, 'image_meta should be an empty object');
		deepEqual( media.get('meta'), { links: {} }, 'meta should just contain an empty links object');

	});

	test( 'Media model data can be set', function() {

		expect ( 54 );

		var media1 = new wp.api.models.Media();
		var media2 = new wp.api.models.Media( testMediaData );

		for ( var key in testMediaData ) {

			media1.set( key, testMediaData[key] );

			deepEqual( media1.get( key ), testMediaData[key], 'Media1 ' + key + ' should be set correctly' );
			deepEqual( media2.get( key ), testMediaData[key], 'Media2 ' + key + ' should be set correctly' );

		}
	});

	test( 'Media model toJSON', function() {

		expect( 7 );

		var media = new wp.api.models.Media( testMediaData );
		var mediaJSON = media.toJSON();

		// Check that dates are correctly converted to a string.
		equal( mediaJSON.date, media.get( 'date' ).toISOString() );
		equal( mediaJSON.modified, media.get( 'modified' ).toISOString() );

		// Check that user is setup correctly
		equal( mediaJSON.author.get( 'ID' ), 1 );
		equal( mediaJSON.author.get( 'username' ), 'wordpress' );
		equal( mediaJSON.author.get( 'first_name' ), 'Word' );
		equal( mediaJSON.author.get( 'last_name' ), 'Press' );
		equal( mediaJSON.author.get( 'email' ), 'generic@wordpress.org' );
	});

	test( 'Media response is parsed correctly', function() {

		expect( 5 );

		var server = sinon.fakeServer.create();

		server.respondWith(
			'GET',
			'/media/1',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testMediaResponse ) ]
		);

		var media = new wp.api.models.Media( { ID: 1 } );
		media.fetch();

		server.respond();

		equal( media.get( 'title' ), '143Construction-600&#215;400', 'Title is set properly' );

		// Check date & modified is correctly parsed.
		equal( Object.prototype.toString.call( media.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
		equal( Object.prototype.toString.call( media.get( 'modified' ) ), '[object Date]', 'modified should be object type Date' );

		// Check if user is setup correctly
		equal( media.get( 'author' ).get( 'username' ), 'admin' );
		equal( media.get( 'author' ).get( 'ID' ), 1 );

		server.restore();

	});

	// Todo: test media parent retrieval

	// Todo: test media collection

})();