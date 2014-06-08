module( 'User Model Tests' );

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

test( 'User model can be instantiated with correct default values', function() {

	expect( 11 );

	// Instantiate Local Contact Backbone Model Object
	var user = new wp.api.models.User();

	equal( user.get('ID'), null, 'Default ID should be null' );
	equal( user.get('username'), '', 'Default username should be empty' );
	equal( user.get('email'), '', 'Default email should be empty' );
	equal( user.get('password'), '', 'Default password should be empty' );
	equal( user.get('name'), '', 'Default name should be empty' );
	equal( user.get('first_name'), '', 'Default first name should be empty' );
	equal( user.get('last_name'), '', 'Default last name should be empty' );
	equal( user.get('nickname'), '', 'Default nickname should be empty' );
	equal( user.get('slug'), '', 'Default slug should be empty' );
	equal( user.get('URL'), '', 'Default URL should be empty' );
	equal( user.get('avatar'), '', 'Default avatar should be empty' );
});

test( 'User model data can be set', function() {

	expect ( 22 );

	// Instantiate 2 new User models.
	// 1 - setting data after creating the model.
	// 2 - passing testUserData when creating.
	var user1 = new wp.api.models.User();
	var user2 = new wp.api.models.User( testUserData );

	for ( var key in testUserData ) {

		user1.set( key, testUserData[key] );

		deepEqual( user1.get( key ), testUserData[key], 'User1 ' + key + ' should be set correctly' );
		deepEqual( user2.get( key ), testUserData[key], 'User2 ' + key + ' should be set correctly' );

	}

});

test( 'User model toJSON', function() {

	expect( 7 );

	var post = new wp.api.models.Post( testData );
	var postJSON = post.toJSON();

	// Check that dates are correctly converted to a string.
	equal( postJSON.date, post.get( 'date' ).toISOString() );
	equal( postJSON.date, post.get( 'modified' ).toISOString() );

	// Check that user is setup correctly
	equal( postJSON.author.get( 'ID' ), 1 );
	equal( postJSON.author.get( 'username' ), 'wordpress' );
	equal( postJSON.author.get( 'first_name' ), 'Word' );
	equal( postJSON.author.get( 'last_name' ), 'Press' );
	equal( postJSON.author.get( 'email' ), 'generic@wordpress.org' );
});