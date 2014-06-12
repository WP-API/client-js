( function() {

	module( 'Term Model Tests' );

	var Backbone = Backbone || {};


	// Sample Post Data.
	var testTermData = {
		'ID': 2,
		'name': 'Politics',
		'slug': 'politics',
		'description': 'This is the politics category.',
		'parent': null,
		'count': 8,
		'link': 'http:\/\/example.com\/category\/politics\/',
		'meta': {
			'links': {
				'collection': 'http:\/\/example.com\/wp-json\/taxonomies\/category\/terms',
				'self': 'http:\/\/example.com\/wp-json\/taxonomies\/category\/terms\/2'
			}
		}
	};

	var testTermResponse = JSON.parse( '{"ID":1,"name":"News","slug":"news","description":"This is the news category.","parent":null,"count":8,"link":"http:\/\/example.com\/category\/news\/","meta":{"links":{"collection":"http:\/\/example.com\/wp-json\/taxonomies\/category\/terms","self":"http:\/\/example.com\/wp-json\/taxonomies\/category\/terms\/1"}}}' );

	test( 'Taxonomy model can be instantiated with correct default values', function() {

		expect( 8 );

		// Instantiate Local Contact Backbone Model Object
		var term = new wp.api.models.Term();

		equal( term.get('ID'), null, 'Default ID is null' );
		equal( term.get('name'), '', 'Default name is empty' );
		equal( term.get('slug'), '', 'Default slug should be empty' );
		equal( term.get('description'), '', 'Default description is empty' );
		equal( term.get('parent'), null, 'Default parent is null' );
		equal( term.get('count'), 0, 'Default count is 0' );
		equal( term.get('link'), '', 'Default link is empty' );
		deepEqual( term.get('meta'), { links: {} }, 'meta should just contain an empty links object');

	});

	test( 'Term model data can be set', function() {

		expect ( 16 );

		var term1 = new wp.api.models.Term();
		var term2 = new wp.api.models.Term( testTermData );

		for ( var key in testTermData ) {

			term1.set( key, testTermData[key] );

			deepEqual( term1.get( key ), testTermData[key], 'Term1 ' + key + ' should be set correctly' );
			deepEqual( term2.get( key ), testTermData[key], 'Term2 ' + key + ' should be set correctly' );

		}

	});

	test( 'Term response is parsed correctly', function() {

		expect( 3 );

		var server = sinon.fakeServer.create();

		server.respondWith(
			'GET',
			'/taxonomies/category/terms/1',
			[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testTermResponse ) ]
		);

		var term = new wp.api.models.Term( { ID: 1, taxonomy: 'category' } );
		term.fetch();

		server.respond();

		equal( term.get( 'name' ), 'News' );
		equal( term.get( 'slug' ), 'news' );
		equal( term.get( 'count' ), 8 );

		server.restore();

	});

	// Todo: Test term collection

})();