module( 'Comment Model Tests' );

var Backbone = Backbone || {};

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

var testCommentData = {
	ID: 2,
	post: 1,
	content: 'Here is a super test comment',
	status: 'approved',
	type: 'comment',
	parent: 1,
	author: new wp.api.models.User( testUserData ),
	date: new Date(),
	date_tz: 'Etc/UTC',
	date_gmt: new Date(),
	meta: {
		links: {
			up: 'http://example.com/wp-json/posts/1',
			self: 'http://example.com/wp-json/posts/1/comments/2'
		}
	}
};

var testCommentResponse = JSON.parse( '{"ID":1,"post":1,"content":"Here is a test comment","status":"approved","type":"comment","parent":0,"author":{"ID":1,"username":"wordpress","email":"generic@wordpress.org","password":"","name":"WordPress","first_name":"Word","last_name":"Press","nickname":"The WordPresser","slug":"wordpress","URL":"http://wordpress.org","avatar":"http://s.w.org/style/images/wp-header-logo-2x.png?1","meta":{"links":{"self":"http://example.com/wp-json/users/1","archives":"http://example.com/wp-json/users/1/posts"}}},"date":"2014-05-22T04:57:25+00:00","date_tz":"UTC","date_gmt":"2014-05-22T04:57:25+00:00","meta":{"links":{"up":"http://example.com/wp-json/posts/1","self":"http://example.com/wp-json/posts/1/comments/2"}}}' );

test( 'Comment model can be instantiated with correct default values', function() {

	expect( 10 );

	// Instantiate Local Contact Backbone Model Object
	var comment = new wp.api.models.Comment();

	equal( comment.get('ID'), null, 'Default ID should be null' );
	equal( comment.get('post'), null, 'Default post should be null' );
	equal( comment.get('content'), '', 'Default content should be empty' );
	equal( comment.get('status'), 'hold', 'Default password should be hold' );
	equal( comment.get('type'), '', 'Default type should be empty' );
	equal( comment.get('parent'), 0, 'Default parent should be 0' );
	ok( comment.get('author') instanceof Backbone.Model );
	equal( Object.prototype.toString.call( comment.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
	equal( Object.prototype.toString.call( comment.get( 'date_gmt' ) ), '[object Date]', 'date_gmt should be object type Date' );

	deepEqual( comment.get('meta'), { links: {} }, 'meta should just contain an empty links object');
});

test( 'Comment model toJSON', function() {

	expect( 7 );

	var comment = new wp.api.models.Comment( testCommentData );
	var commentJSON = comment.toJSON();

	// Check that dates are correctly converted to a string.
	equal( commentJSON.date, comment.get( 'date' ).toISOString() );
	equal( commentJSON.date_gmt, comment.get( 'date_gmt' ).toISOString() );

	// Check that user is setup correctly
	equal( commentJSON.author.get( 'ID' ), 1 );
	equal( commentJSON.author.get( 'username' ), 'wordpress' );
	equal( commentJSON.author.get( 'first_name' ), 'Word' );
	equal( commentJSON.author.get( 'last_name' ), 'Press' );
	equal( commentJSON.author.get( 'email' ), 'generic@wordpress.org' );
});

test( 'Comment response is parsed correctly', function() {

	expect( 4 );

	var server = sinon.fakeServer.create();

	server.respondWith(
		'GET',
		'posts/1/comments/1',
		[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testCommentResponse ) ]
	);

	var comment = new wp.api.models.Comment( { ID: 1, post: 1 } );
	comment.fetch();

	server.respond();

	// Check date & modified is correctly parsed.
	equal( Object.prototype.toString.call( comment.get( 'date' ) ), '[object Date]', 'date should be object type Date' );
	equal( Object.prototype.toString.call( comment.get( 'date_gmt' ) ), '[object Date]', 'modified should be object type Date' );

	// Check if user is setup correctly
	equal( comment.get( 'author' ).get( 'username' ), 'wordpress' );
	equal( comment.get( 'author' ).get( 'ID' ), 1 );

	server.restore();

});

test( 'Comment parent is retrieved correctly', function() {

	expect( 2 );

	// 1. Test fetching parent from API.

	var server = sinon.fakeServer.create();
	server.respondWith(
		'GET',
		'posts/1/comments/2',
		[ 200, { 'Content-Type': 'application/json' }, JSON.stringify( testCommentResponse )]
	);

	var comment = new wp.api.models.Comment( testCommentData );
	var parent = comment.parent();
	server.respond();

	equal( parent.toJSON().ID, 1, 'Post parent model should be retrieved correctly' );

	// 2. Test fetching parent from if it is part of the same collection as the current model.

	var comments = new wp.api.collections.Comments([
		new wp.api.models.Comment( { ID: 1, post: 1, content: 'Some content!' } )
	]);

	var comment2 = comments.create( testCommentData );

	equal( comment2.parent().get('content'), 'Some content!' );

});
