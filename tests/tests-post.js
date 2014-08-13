var Backbone = Backbone || {};

( function() {

	module( 'Post and Revision Model Tests' );

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

	// Sample Post Data.
	var testPostData = {
		title:   'Test Post',
		content: '<p>Nulla At Nulla Justo, Eget Luctus Tortor. Nulla Facilisi Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus. Hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p> <p>Suspendisse. Dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio.<\/p>\n',
		type: 'page',
		status: 'publish',
		author: new wp.api.models.User( testUserData ),
		parent: 1,
		date: new Date(),
		date_gmt: new Date(),
		modified: new Date(),
		modified_gmt: new Date(),
		format: 'standard',
		slug: 'post-slug',
		guid: 'example.com',
		excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		menu_order: 1,
		comment_status: 'closed',
		ping_status: 'closed',
		sticky: true,
		date_tz: 'America/New_York',
		modified_tz: 'America/New_York',
		featured_imag: null
	};

	// Sample Post Response.
	var testPostResponse = JSON.parse( '{"ID":1,"title":"Test Post","status":"publish","type":"page","author":{"ID":1,"username":"admin","name":"admin","first_name":"","last_name":"","nickname":"admin","slug":"admin","URL":"","avatar":"http:\/\/1.gravatar.com\/avatar\/b17c1f19d80bf8f61c3f14962153f959?s=96","description":"","email":"admin@example.com","registered":"2014-03-05T18:37:51+00:00","meta":{"links":{"self":"http:\/\/example.com\/wp-json\/users\/1","archives":"http:\/\/example.com\/wp-json\/users\/1\/posts"}}},"content":"","parent":0,"link":"http:\/\/example.com\/test-post-2\/","date":"2014-05-11T19:29:15+00:00","modified":"2014-05-11T19:29:15+00:00","format":"standard","slug":"test-post-2","guid":"http:\/\/example.com\/test-post-2\/","excerpt":null,"menu_order":1,"comment_status":"closed","ping_status":"closed","sticky":false,"date_tz":"UTC","date_gmt":"2014-05-11T19:29:15+00:00","modified_tz":"UTC","modified_gmt":"2014-05-11T19:29:15+00:00","password":"","meta":{"links":{"self":"http:\/\/example.com\/wp-json\/posts\/1","author":"http:\/\/example.com\/wp-json\/users\/1","collection":"http:\/\/example.com\/wp-json\/posts","replies":"http:\/\/example.com\/wp-json\/posts\/1\/comments","version-history":"http:\/\/example.com\/wp-json\/posts\/1\/revisions"}},"featured_image":null,"terms":[]}' );
	var testPostCollectionResponse = JSON.parse( '[{"ID":1,"title":"Test Post","status":"publish","type":"page","author":{"ID":1,"username":"admin","name":"admin","first_name":"","last_name":"","nickname":"admin","slug":"admin","URL":"","avatar":"http:\/\/1.gravatar.com\/avatar\/b17c1f19d80bf8f61c3f14962153f959?s=96","description":"","email":"admin@example.com","registered":"2014-03-05T18:37:51+00:00","meta":{"links":{"self":"http:\/\/example.com\/wp-json\/users\/1","archives":"http:\/\/example.com\/wp-json\/users\/1\/posts"}}},"content":"","parent":0,"link":"http:\/\/example.com\/test-post-2\/","date":"2014-05-11T19:29:15+00:00","modified":"2014-05-11T19:29:15+00:00","format":"standard","slug":"test-post-2","guid":"http:\/\/example.com\/test-post-2\/","excerpt":null,"menu_order":1,"comment_status":"closed","ping_status":"closed","sticky":false,"date_tz":"UTC","date_gmt":"2014-05-11T19:29:15+00:00","modified_tz":"UTC","modified_gmt":"2014-05-11T19:29:15+00:00","password":"","meta":{"links":{"self":"http:\/\/example.com\/wp-json\/posts\/1","author":"http:\/\/example.com\/wp-json\/users\/1","collection":"http:\/\/example.com\/wp-json\/posts","replies":"http:\/\/example.com\/wp-json\/posts\/1\/comments","version-history":"http:\/\/example.com\/wp-json\/posts\/1\/revisions"}},"featured_image":null,"terms":[]}]' );
	var testRevisionCollectionResponse = JSON.parse( '[{"ID":2,"title":"test","status":"inherit","type":"revision","author":{"ID":1,"username":"admin","name":"admin","first_name":"word","last_name":"press","nickname":"admin","slug":"admin","URL":"","avatar":"","description":"","registered":"2013-04-04T16:58:14+00:00","meta":{"links":{"self":"http:\/\/example.com\/wp-json\/users\/1","archives":"http:\/\/example.com\/wp-json\/users\/1\/posts"}}},"content":"Revision content","parent":0,"link":"http:\/\/example.com\/2014\/05\/1-revision-v1\/","date":"2014-05-28T00:55:04+00:00","modified":"2014-05-28T00:55:04+00:00","format":"standard","slug":"1-revision-v1","guid":"http:\/\/example.com\/2014\/05\/1-revision-v1\/","excerpt":"This is the excerpt","menu_order":0,"comment_status":"closed","ping_status":"open","sticky":false,"date_tz":"UTC","date_gmt":"2014-05-28T00:55:04+00:00","modified_tz":"UTC","modified_gmt":"2014-05-28T00:55:04+00:00","password":"","title_raw":"test","content_raw":"sdfsdfsf sdfsfdsf","excerpt_raw":"","guid_raw":"http:\/\/example.com\/2014\/05\/1-revision-v1\/","post_meta":[],"meta":{"links":{"self":"http:\/\/example.com\/wp-json\/posts\/1/revisions/2","author":"http:\/\/example.com\/wp-json\/users\/1","collection":"http:\/\/example.com\/wp-json\/posts/1/revisions","up":"http:\/\/example.com\/wp-json\/posts\/1"}},"terms":[]}]' );

	test( 'Post model can be instantiated with correct default values', function() {

		expect( 25 );

		// Instantiate Local Contact Backbone Model Object
		var post = new wp.api.models.Post();

		equal( post.get('ID'), null, 'Default ID should be null' );
		equal( post.get('title'), '', 'Default title should be empty' );
		equal( post.get('status'), 'draft' , 'Default status should be draft' );
		equal( post.get('type'), 'post', 'Default type should be post' );
		ok( post.get('author') instanceof Backbone.Model );
		equal( post.get('content'), '', 'Content should be empty' );
		equal( post.get('link'), '', 'Link should be empty' );
		equal( post.get('parent'), 0, 'Parent should be 0' );
		equal( Object.prototype.toString.call( post.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
		equal( Object.prototype.toString.call( post.get( 'date_gmt' ) ), '[object Date]', 'date_gmt should be object type Date' );
		equal( Object.prototype.toString.call( post.get('modified') ), '[object Date]', 'modified should be object type Date' );

		equal( post.get('format'), 'standard', 'Format should be standard' );
		equal( post.get('slug'), '', 'Slug should be empty' );
		equal( post.get('guid'), '', 'guid should be empty' );
		equal( post.get('excerpt'), '', 'Excerpt should be empty' );
		equal( post.get('menu_order'), 0, 'menu_order should be 0' );
		equal( post.get('comment_status'), 'open', 'comment_status should be open' );
		equal( post.get('ping_status'), 'open', 'ping_status should be open' );
		equal( post.get('sticky'), false, 'sticky should be false' );
		equal( post.get('date_tz'), 'Etc/UTC', 'date_tz should be Etc/UTC' );
		equal( post.get('modified_tz'), 'Etc/UTC', 'modified_tz should be Etc/UTC' );
		equal( post.get('featured_image'), null, 'Featured image should be null' );
		deepEqual( post.get('terms'), {}, 'terms should be an empty object' );
		deepEqual( post.get('post_meta'), {}, 'post_meta should be an empty object');
		deepEqual( post.get('meta'), { links: {} }, 'meta should just contain an empty links object');

	});

	test( 'Post model data can be set', function() {

		expect ( 42 );

		// Instantiate 2 new Post models.
		// 1 - setting data after creating the model.
		// 2 - passing testPostData when creating.
		var post1 = new wp.api.models.Post();
		var post2 = new wp.api.models.Post( testPostData );

		for ( var key in testPostData ) {

			post1.set( key, testPostData[key] );

			deepEqual( post1.get( key ), testPostData[key], 'Post1 ' + key + ' should be set correctly' );
			deepEqual( post2.get( key ), testPostData[key], 'Post2 ' + key + ' should be set correctly' );

		}

	});

	test( 'Post model toJSON', function() {

		expect( 7 );

		var post = new wp.api.models.Post( testPostData );
		var postJSON = post.toJSON();

		// Check that dates are correctly converted to a string.
		equal( postJSON.date, post.get( 'date' ).toISOString() );
		equal( postJSON.modified, post.get( 'modified' ).toISOString() );

		// Check that user is setup correctly
		equal( postJSON.author.get( 'ID' ), 1 );
		equal( postJSON.author.get( 'username' ), 'wordpress' );
		equal( postJSON.author.get( 'first_name' ), 'Word' );
		equal( postJSON.author.get( 'last_name' ), 'Press' );
		equal( postJSON.author.get( 'email' ), 'generic@wordpress.org' );
	});

	test( 'Post response is parsed correctly', function() {

		expect( 4 );

		var server = sinon.fakeServer.create();

		server.respondWith(
			'GET',
			'/posts/1',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPostResponse ) ]
		);

		var post = new wp.api.models.Post( { ID: 1 } );
		post.fetch();

		server.respond();

		// Check date & modified is correctly parsed.
		equal( Object.prototype.toString.call( post.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
		equal( Object.prototype.toString.call( post.get( 'modified' ) ), '[object Date]', 'modified should be object type Date' );

		// Check if user is setup correctly
		equal( post.get( 'author' ).get( 'username' ), 'admin' );
		equal( post.get( 'author' ).get( 'ID' ), 1 );

		server.restore();

	});

	test( 'Post revision collection response is parsed correctly', function() {

		expect( 4 );

		var server = sinon.fakeServer.create();

		server.respondWith(
			'GET',
			'/posts/1/revisions',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testRevisionCollectionResponse ) ]
		);

		var revisions = new wp.api.collections.Revisions( {}, { parent: 1 } );
		revisions.fetch();

		server.respond();

		// Check date & modified is correctly parsed.
		equal( Object.prototype.toString.call( revisions.at( 0 ).get( 'date' ) ), '[object Date]', 'date should be object type Date' );
		equal( Object.prototype.toString.call( revisions.at( 0 ).get( 'modified' ) ), '[object Date]', 'modified should be object type Date' );

		// Check if user is setup correctly
		equal( revisions.at( 0 ).get( 'author' ).get( 'username' ), 'admin' );
		equal( revisions.at( 0 ).get( 'author' ).get( 'ID' ), 1 );

		server.restore();

	});

	test( 'Post parent is retrieved correctly', function() {

		expect( 2 );

		// 1. Test fetching parent from API.

		var server = sinon.fakeServer.create();
		server.respondWith(
			'GET',
			'/posts/1',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPostResponse )]
		);

		var post = new wp.api.models.Post( testPostData );
		var parent = post.parent();
		server.respond();

		equal( parent.toJSON().ID, 1, 'Post parent model should be retrieved correctly' );

		// 2. Test fetching parent from if it is part of the same collection as the current post model.

		var posts = new wp.api.collections.Posts([
			new wp.api.models.Post({ ID:1, title: 'Test Parent' })
		]);

		var post2 = posts.create( testPostData );

		equal( post2.parent().get('title'), 'Test Parent' );

		server.restore();

	});

	test( 'Post collection is received and setup correctly', function() {

		expect( 1 );

		var server = sinon.fakeServer.create();
		server.respondWith(
			'GET',
			'/posts',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPostCollectionResponse )]
		);

		var posts = new wp.api.collections.Posts();
		posts.fetch();
		server.respond();

		var post = posts.at( 0 );

		equal( post.get('title'), 'Test Post' );

		server.restore();

	});

	test( 'Post collection pagination is working', function() {

		expect( 17 );

		var server = sinon.fakeServer.create();
		server.respondWith(
			'GET',
			'/posts',
			[ 200, { 'Content-Type': 'application/json', 'X-WP-TotalPages': '3', 'X-WP-Total': '3' }, JSON.stringify( testPostCollectionResponse )]
		);

		var posts = new wp.api.collections.Posts();
		posts.fetch();
		server.respond();

		equal( posts.hasMore(), true );
		equal( posts.state.currentPage, 1 );
		equal( posts.state.totalObjects, 3 );
		equal( posts.state.totalPages, 3 );

		server.respondWith(
			'GET',
			'/posts?page=2',
			[ 200, { 'Content-Type': 'application/json', 'X-WP-TotalPages': '3', 'X-WP-Total': '3' }, JSON.stringify( testPostCollectionResponse )]
		);

		posts.more();
		server.respond();

		equal( posts.hasMore(), true );
		equal( posts.state.currentPage, 2 );
		equal( posts.state.totalObjects, 3 );
		equal( posts.state.totalPages, 3 );

		server.respondWith(
			'GET',
			'/posts?page=3',
			[ 200, { 'Content-Type': 'application/json', 'X-WP-TotalPages': '3', 'X-WP-Total': '3' }, JSON.stringify( testPostCollectionResponse )]
		);

		posts.more();
		server.respond();

		equal( posts.hasMore(), false );
		equal( posts.state.currentPage, 3 );
		equal( posts.state.totalObjects, 3 );
		equal( posts.state.totalPages, 3 );

		equal( posts.more(), false );

		server.respondWith(
			'GET',
			'/posts',
			[ 200, { 'Content-Type': 'application/json', 'X-WP-TotalPages': '3', 'X-WP-Total': '3' }, JSON.stringify( testPostCollectionResponse )]
		);

		posts.fetch();
		server.respond();

		equal( posts.hasMore(), true );
		equal( posts.state.currentPage, 1 );
		equal( posts.state.totalObjects, 3 );
		equal( posts.state.totalPages, 3 );

		server.restore();

	});

})();