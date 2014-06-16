( function() {

	module( 'Post Type Model Tests' );

	// Sample Post Data.
	var testPostTypeData = {
		'name': 'Posts',
		'slug': 'post',
		'description': '',
		'labels': {
			'name': 'Posts',
			'singular_name': 'Post',
			'add_new': 'Add New',
			'add_new_item': 'Add New Post',
			'edit_item': 'Edit Post',
			'new_item': 'New Post',
			'view_item': 'View Post',
			'search_items': 'Search Posts',
			'not_found': 'No posts found.',
			'not_found_in_trash': 'No posts found in Trash.',
			'parent_item_colon': null,
			'all_items': 'All Posts',
			'menu_name': 'Posts',
			'name_admin_bar': 'Post'
		},
		'queryable': true,
		'searchable': true,
		'hierarchical': false,
		'meta': {
			'links': {
				'self': 'http:\/\/example.com\/wp-json\/posts\/types\/post',
				'collection': 'http:\/\/example.com\/wp-json\/posts\/types',
				'http:\/\/wp-api.org\/1.1\/collections\/taxonomy\/': 'http:\/\/example.com\/wp-json\/taxonomies?type=post',
				'archives': 'http:\/\/example.com\/wp-json\/posts'
			}
		},
		'taxonomies': []
	}

	var testPostTypeResponse = JSON.parse( '{"name":"Pages","slug":"page","description":"","labels":{"name":"Pages","singular_name":"Page","add_new":"Add New","add_new_item":"Add New Page","edit_item":"Edit Page","new_item":"New Page","view_item":"View Page","search_items":"Search Pages","not_found":"No pages found.","not_found_in_trash":"No pages found in Trash.","parent_item_colon":"Parent Page:","all_items":"All Pages","menu_name":"Pages","name_admin_bar":"Page"},"queryable":false,"searchable":true,"hierarchical":true,"meta":{"links":{"self":"http:\/\/example.com\/wp-json\/posts\/types\/page","collection":"http:\/\/example.com\/wp-json\/posts\/types","http:\/\/wp-api.org\/1.1\/collections\/taxonomy\/":"http:\/\/example.com\/wp-json\/taxonomies?type=page","archives":"http:\/\/example.com\/wp-json\/pages"}},"taxonomies":[]}' );

	test( 'Post type model can be instantiated with correct default values', function() {

		expect( 8 );

		// Instantiate Local Contact Backbone Model Object
		var postType = new wp.api.models.PostType();

		equal( postType.get('name'), '', 'Default name is empty' );
		equal( postType.get('slug'), null, 'Default slug should be empty' );
		deepEqual( postType.get('labels'), {} , 'Default labels should be an empty object' );
		deepEqual( postType.get('queryable'), false, 'Default queryable should be false' );
		deepEqual( postType.get('searchable'), false, 'Default searchable should be false' );
		equal( postType.get('hierarchical'), false, 'Default hierarchical should be false' );
		ok( postType.get('taxonomies') instanceof Array );
		deepEqual( postType.get('meta'), { links: {} }, 'meta should just contain an empty links object');

	});

	test( 'Post type model data can be set', function() {

		expect ( 18 );

		var postType1 = new wp.api.models.PostType();
		var postType2 = new wp.api.models.PostType( testPostTypeData );

		for ( var key in testPostTypeData ) {

			postType1.set( key, testPostTypeData[key] );

			deepEqual( postType1.get( key ), testPostTypeData[key], 'postType1 ' + key + ' should be set correctly' );
			deepEqual( postType2.get( key ), testPostTypeData[key], 'postType2 ' + key + ' should be set correctly' );

		}

	});

	test( 'Post type response is parsed correctly', function() {

		expect( 3 );

		var server = sinon.fakeServer.create();

		server.respondWith(
			'GET',
			'/posts/types/page',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPostTypeResponse ) ]
		);

		var postType = new wp.api.models.PostType( { slug: 'page' } );
		postType.fetch();

		server.respond();

		equal( postType.get( 'name' ), 'Pages' );
		equal( postType.get( 'queryable' ), false );
		equal( postType.get( 'searchable' ), true );

		server.restore();

	});

	// Todo: Test post type collection
	// Todo: Test post type taxonomies

})();