module( 'Page Model Tests' );

var Backbone = Backbone || {};

// Sample User Data
var testUserData = {
	ID: 1,
	username: 'wordpress',
	email: 'generic@wordpress.org',
	password: '',
	name: 'WordPress',
	first_name: 'Word',
	last_name: 'Press',
	nickname: 'The WordPresser',
	slug: 'wordpress',
	URL: 'http://wordpress.org',
	avatar: 'http://s.w.org/style/images/wp-header-logo-2x.png?1'
};

// Sample Post Data.
var testPageData = {
	title:   'Test Page',
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
	modified_tz: 'America/New_York'
};

var testPageResponse = JSON.parse( '{"ID":1,"title":"test","status":"publish","type":"page","author":{"ID":1,"username":"admin","name":"admin","first_name":"taylor","last_name":"lovett","nickname":"admin","slug":"admin","URL":"","avatar":"http://1.gravatar.com/avatar/77778145a1b7a2cad0b279b432979292?s=96","description":"","email":"admin@taylorlovett.com","registered":"2013-04-04T16:58:14+00:00","meta":{"links":{"self":"http://example.com/wp-json/users/1","archives":"http://example.com/wp-json/users/1/posts"}}},"content":"Test content","parent":0,"link":"http://example.com/test/","date":"2014-05-03T15:09:39+00:00","modified":"2014-05-03T15:09:39+00:00","format":"standard","slug":"test","guid":"http://example.com/?page_id=3186","excerpt":"Test content","menu_order":0,"comment_status":"closed","ping_status":"open","sticky":false,"date_tz":"UTC","date_gmt":"2014-05-03T15:09:39+00:00","modified_tz":"UTC","modified_gmt":"2014-05-03T15:09:39+00:00","meta":{"links":{"self":"http://example.com/wp-json/pages/test","author":"http://example.com/wp-json/users/1","collection":"http://example.com/wp-json/pages","replies":"http://example.com/wp-json/pages/3186/comments","version-history":"http://example.com/wp-json/pages/3186/revisions"}},"featured_image":null,"terms":[]}' );

test( 'Page model can be instantiated with correct default values', function() {

	expect( 24 );

	// Instantiate Local Contact Backbone Model Object
	var page = new wp.api.models.Page();

	equal( page.get('ID'), null, 'Default ID should be null' );
	equal( page.get('title'), '', 'Default title should be empty' );
	equal( page.get('status'), 'draft' , 'Default status should be draft' );
	equal( page.get('type'), 'page', 'Default type should be post' );
	ok( page.get('author') instanceof Backbone.Model );
	equal( page.get('content'), '', 'Content should be empty' );
	equal( page.get('link'), '', 'Link should be empty' );
	equal( page.get('parent'), 0, 'Parent should be 0' );
	equal( Object.prototype.toString.call( page.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
	equal( Object.prototype.toString.call( page.get( 'date_gmt' ) ), '[object Date]', 'date_gmt should be object type Date' );
	equal( Object.prototype.toString.call( page.get('modified') ), '[object Date]', 'modified should be object type Date' );
	equal( Object.prototype.toString.call( page.get('modified_gmt') ), '[object Date]', 'modified should be object type Date' );
	equal( page.get('format'), 'standard', 'Format should be standard' );
	equal( page.get('slug'), '', 'Slug should be empty' );
	equal( page.get('guid'), '', 'guid should be empty' );
	equal( page.get('excerpt'), '', 'Excerpt should be empty' );
	equal( page.get('menu_order'), 0, 'menu_order should be 0' );
	equal( page.get('comment_status'), 'closed', 'comment_status should be open' );
	equal( page.get('ping_status'), 'open', 'ping_status should be open' );
	equal( page.get('sticky'), false, 'sticky should be false' );
	equal( page.get('date_tz'), 'Etc/UTC', 'date_tz should be Etc/UTC' );
	equal( page.get('modified_tz'), 'Etc/UTC', 'modified_tz should be Etc/UTC' );
	deepEqual( page.get('terms'), [], 'terms should be an empty object' );
	deepEqual( page.get('meta'), { links: {} }, 'meta should just contain an empty links object');

});

test( 'Page model data can be set', function() {

	expect ( 40 );

	// Instantiate 2 new Page models.
	// 1 - setting data after creating the model.
	// 2 - passing testPageData when creating.
	var page1 = new wp.api.models.Page();
	var page2 = new wp.api.models.Page( testPageData );

	for ( var key in testPageData ) {

		page1.set( key, testPageData[key] );

		deepEqual( page1.get( key ), testPageData[key], 'Page1 ' + key + ' should be set correctly' );
		deepEqual( page2.get( key ), testPageData[key], 'Page2 ' + key + ' should be set correctly' );

	}

});

test( 'Page model toJSON', function() {

	expect( 7 );

	var page = new wp.api.models.Page( testPageData );
	var pageJSON = page.toJSON();

	// Check that dates are correctly converted to a string.
	equal( pageJSON.date, page.get( 'date' ).toISOString() );
	equal( pageJSON.modified, page.get( 'modified' ).toISOString() );

	// Check that user is setup correctly
	equal( pageJSON.author.get( 'ID' ), 1 );
	equal( pageJSON.author.get( 'username' ), 'wordpress' );
	equal( pageJSON.author.get( 'first_name' ), 'Word' );
	equal( pageJSON.author.get( 'last_name' ), 'Press' );
	equal( pageJSON.author.get( 'email' ), 'generic@wordpress.org' );
});

test( 'Page response is parsed correctly', function() {

	expect( 4 );

	var server = sinon.fakeServer.create();

	server.respondWith(
		'GET',
		'/pages/1',
		[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPageResponse ) ]
	);

	var page = new wp.api.models.Page( { ID: 1 } );
	page.fetch();

	server.respond();

	// Check date & modified is correctly parsed.
	equal( Object.prototype.toString.call( page.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
	equal( Object.prototype.toString.call( page.get( 'modified' ) ), '[object Date]', 'modified should be object type Date' );

	// Check if user is setup correctly
	equal( page.get( 'author' ).get( 'username' ), 'admin' );
	equal( page.get( 'author' ).get( 'ID' ), 1 );

	server.restore();

});

test( 'Page parent is retrieved correctly', function() {

	expect( 2 );

	// 1. Test fetching parent from API.

	var server = sinon.fakeServer.create();
	server.respondWith(
		'GET',
		'/pages/1',
		[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testPageResponse )]
	);

	var page = new wp.api.models.Page( testPageData );
	var parent = page.parent();
	server.respond();

	equal( parent.toJSON().ID, 1, 'Post parent model should be retrieved correctly' );

	// 2. Test fetching parent from if it is part of the same collection as the current page model.

	var pages = new wp.api.collections.Pages([
		new wp.api.models.Page({ ID:1, title: 'Test Parent' })
	]);

	var page2 = pages.create( testPageData );

	equal( page2.parent().get('title'), 'Test Parent' );

});
