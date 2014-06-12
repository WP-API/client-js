module( 'Taxonomy Model Tests' );

var Backbone = Backbone || {};


// Sample Post Data.
var testTaxonomyData = {
	name: 'Category',
	slug: 'category',
	labels: {
		"name": "Categories",
		"singular_name": "Category",
		"search_items": "Search Categories",
		"popular_items": null,
		"all_items": "All Categories",
		"parent_item": "Parent Category",
		"parent_item_colon": "Parent Category:",
		"edit_item": "Edit Category",
		"view_item": "View Category",
		"update_item": "Update Category",
		"add_new_item": "Add New Category",
		"new_item_name": "New Category Name",
		"separate_items_with_commas": null,
		"add_or_remove_items": null,
		"choose_from_most_used": null,
		"not_found": null,
		"menu_name": "Categories",
		"name_admin_bar": "category"
	},
	types: {
		"post": {
			"name": "Posts",
			"slug": "post",
			"description": "",
			"labels": {
				"name": "Posts",
				"singular_name": "Post",
				"add_new": "Add New",
				"add_new_item": "Add New Post",
				"edit_item": "Edit Post",
				"new_item": "New Post",
				"view_item": "View Post",
				"search_items": "Search Posts",
				"not_found": "No posts found.",
				"not_found_in_trash": "No posts found in Trash.",
				"parent_item_colon": null,
				"all_items": "All Posts",
				"menu_name": "Posts",
				"name_admin_bar": "Post"
			},
			"queryable": true,
			"searchable": true,
			"hierarchical": false,
			"meta": {
				"links": {
					"self": "http://example.com/wp-json/posts/types/post",
					"collection": "http://example.com/wp-json/posts/types",
					"http://wp-api.org/1.1/collections/taxonomy/": "http://example.com/wp-json/taxonomies?type=post",
					"archives": "http://example.com/wp-json/posts"
				}
			}
		}
	},
	show_cloud: false,
	hierarchical: false,
	meta: {
		links: {
			"archives": "http://example.com/wp-json/taxonomies/category/terms",
			"collection": "http://example.com/wp-json/taxonomies",
			"self": "http://example.com/wp-json/taxonomies/category"
		}
	}
};

var testTaxonomyResponse = JSON.parse( '{"name":"Categories","slug":"category","labels":{"name":"Categories","singular_name":"Category","search_items":"Search Categories","popular_items":null,"all_items":"All Categories","parent_item":"Parent Category","parent_item_colon":"Parent Category:","edit_item":"Edit Category","view_item":"View Category","update_item":"Update Category","add_new_item":"Add New Category","new_item_name":"New Category Name","separate_items_with_commas":null,"add_or_remove_items":null,"choose_from_most_used":null,"not_found":null,"menu_name":"Categories","name_admin_bar":"category"},"types":{"post":{"name":"Posts","slug":"post","description":"","labels":{"name":"Posts","singular_name":"Post","add_new":"Add New","add_new_item":"Add New Post","edit_item":"Edit Post","new_item":"New Post","view_item":"View Post","search_items":"Search Posts","not_found":"No posts found.","not_found_in_trash":"No posts found in Trash.","parent_item_colon":null,"all_items":"All Posts","menu_name":"Posts","name_admin_bar":"Post"},"queryable":true,"searchable":true,"hierarchical":false,"meta":{"links":{"self":"http:\/\/example.com\/wp-json\/posts\/types\/post","collection":"http:\/\/example.com\/wp-json\/posts\/types","http:\/\/wp-api.org\/1.1\/collections\/taxonomy\/":"http:\/\/example.com\/wp-json\/taxonomies?type=post","archives":"http:\/\/example.com\/wp-json\/posts"}}}},"show_cloud":true,"hierarchical":true,"meta":{"links":{"archives":"http:\/\/example.com\/wp-json\/taxonomies\/category\/terms","collection":"http:\/\/example.com\/wp-json\/taxonomies","self":"http:\/\/example.com\/wp-json\/taxonomies\/category"}}}' );

test( 'Taxonomy model can be instantiated with correct default values', function() {

	expect( 7 );

	// Instantiate Local Contact Backbone Model Object
	var taxonomy = new wp.api.models.Taxonomy();

	equal( taxonomy.get('name'), '', 'Default name is empty' );
	equal( taxonomy.get('slug'), null, 'Default slug should be empty' );
	deepEqual( taxonomy.get('labels'), {} , 'Default labels should be an empty object' );
	deepEqual( taxonomy.get('types'), {} , 'Default types should be an empty object' );
	equal( taxonomy.get('show_cloud'), false, 'Default show_cloud should be false' );
	equal( taxonomy.get('hierarchical'), false, 'Default hierarchical should be false' );
	deepEqual( taxonomy.get('meta'), { links: {} }, 'meta should just contain an empty links object');

});

test( 'Taxonomy model data can be set', function() {

	expect ( 14 );

	var taxonomy1 = new wp.api.models.Taxonomy();
	var taxonomy2 = new wp.api.models.Taxonomy( testTaxonomyData );

	for ( var key in testTaxonomyData ) {

		taxonomy1.set( key, testTaxonomyData[key] );

		deepEqual( taxonomy1.get( key ), testTaxonomyData[key], 'Taxonomy1 ' + key + ' should be set correctly' );
		deepEqual( taxonomy2.get( key ), testTaxonomyData[key], 'Taxonomy2 ' + key + ' should be set correctly' );

	}

});

test( 'Taxonomy response is parsed correctly', function() {

	expect( 3 );

	var server = sinon.fakeServer.create();

	server.respondWith(
		'GET',
		'/taxonomies/category',
		[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testTaxonomyResponse ) ]
	);

	var taxonomy = new wp.api.models.Taxonomy( { slug: 'category' } );
	taxonomy.fetch();

	server.respond();

	equal( taxonomy.get( 'name' ), 'Categories' );
	equal( taxonomy.get( 'labels' ).name, 'Categories' );
	equal( taxonomy.get( 'types' ).post.name, 'Posts' );

	server.restore();

});

// Todo: Test taxonomy collection
