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