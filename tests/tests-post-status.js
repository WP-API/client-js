( function() {

	module( 'Post Status Model Tests' );

	// Sample Post Data.
	var testPostStatusData = {
		'name': 'Published',
		'slug': 'publish',
		'public': true,
		'protected': false,
		'private': false,
		'queryable': true,
		'show_in_list': true,
		'meta': {
			'links': {
				'self': 'http:\/\/example.com\/wp-json\/posts\/statuses\/publish',
				'up': 'http:\/\/example.com\/wp-json\/posts\/statuses'
			}
		}
	};

	var testPostStatusResponse = JSON.parse( '{"name":"Published","slug":"publish","public":true,"protected":false,"private":false,"queryable":true,"show_in_list":true,"meta":{"links":{"self":"http:\/\/example.com\/wp-json\/posts\/statuses\/publish","up":"http:\/\/example.com\/wp-json\/posts\/statuses"}}}' );

	test( 'Post status model can be instantiated with correct default values', function() {

		expect( 8 );

		// Instantiate Local Contact Backbone Model Object
		var postStatus = new wp.api.models.PostStatus();

		equal( postStatus.get('name'), '', 'Default name is empty' );
		equal( postStatus.get('slug'), null, 'Default slug should be null' );
		equal( postStatus.get('public'), true, 'Default public should be true' );
		equal( postStatus.get('protected'), false, 'Default protected should be false' );
		equal( postStatus.get('private'), false, 'Default private should be false' );
		equal( postStatus.get('queryable'), true, 'Default queryable should be true' );
		equal( postStatus.get('show_in_list'), true, 'Default show in list should be true' );

		deepEqual( postStatus.get('meta'), { links: {} }, 'meta should just contain an empty links object');

	});

	test( 'Post status model data can be set', function() {

		expect ( 16 );

		var postStatus1 = new wp.api.models.PostStatus();
		var postStatus2 = new wp.api.models.PostType( testPostStatusData );

		for ( var key in testPostStatusData ) {

			postStatus1.set( key, testPostStatusData[key] );

			deepEqual( postStatus1.get( key ), testPostStatusData[key], 'postStatus1 ' + key + ' should be set correctly' );
			deepEqual( postStatus2.get( key ), testPostStatusData[key], 'postStatus2 ' + key + ' should be set correctly' );

		}

	});

	test( 'Post status response is parsed correctly', function() {

		expect( 3 );

		var server = sinon.fakeServer.create();

		server.respondWith(
			'GET',
			'/posts/statuses/publish',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPostStatusResponse ) ]
		);

		var postStatus = new wp.api.models.PostStatus( { slug: 'publish' } );
		postStatus.fetch();

		server.respond();

		equal( postStatus.get( 'name' ), 'Published' );
		equal( postStatus.get( 'queryable' ), true );
		equal( postStatus.get( 'private' ), false );

		server.restore();

	});

	// Todo: Test post status collection

})();