module( 'WP-API JS Client Tests' );

// Test updating a post to verify the date is unchanged.
QUnit.test( 'Testing dates when updating posts.' , function( assert ) {
	var done = assert.async();
	assert.expect( 1 );

	wp.api.loadPromise.done( function() {

		var post = new wp.api.models.Post( {id: 1} );
		post.fetch().done( function() {

			var date = post.get( 'date' );

			post.save().always( function() {

				// Get the post one more time to check its date.
				var post = new wp.api.models.Post( {id: 1} );
				post.fetch().done( function() {
					assert.equal( post.get( 'date' ).getTime(), date.getTime(), 'The date should not change when a post is updated.' );
					done();
				} );
			} );
		} );
	} );
} );

QUnit.test( 'API Loaded correctly', function( assert ) {
	var done = assert.async();

	assert.expect( 2 );
	assert.ok( wp.api.loadPromise );

	wp.api.loadPromise.done( function() {
		assert.ok( wp.api.models );
		done();
	} );

} );


// Verify collections loaded.
var collectionClassNames = [
		'Categories',
		'Comments',
		'Media',
		'Pages',
		'Posts',
		'Statuses',
		'Tags',
		'Taxonomies',
		'Types',
		'Users'
	];

_.each( collectionClassNames, function( className ) {
	QUnit.test( 'Testing ' + className + ' collection.', function( assert ) {
		var done = assert.async();

		assert.expect( 2 );

		wp.api.loadPromise.done( function() {
			var theCollection = new wp.api.collections[ className ]();
			assert.ok( theCollection, 'We can instantiate wp.api.collections.' + className );
			theCollection.fetch().done( function() {
				assert.equal( 1, theCollection.state.currentPage, 'We should be on page 1 of the collection in ' + className  );
				done();
			} );

		} );

	});
} );

var modelsWithIdsClassNames =
	[
		'Category',
		'Media',
		'Page',
		'Post',
		'Tag',
		'User'
	];


_.each( modelsWithIdsClassNames, function( className ) {

	QUnit.test( 'Checking ' + className + ' model.' , function( assert ) {
		var done = assert.async();

		assert.expect( 2 );

		wp.api.loadPromise.done( function() {
			var theModel = new wp.api.models[ className ]();
			assert.ok( theModel, 'We can instantiate wp.api.models.' + className );
			theModel.fetch().done( function() {
				var theModel2 = new wp.api.models[ className ]();
				theModel2.set( 'id', theModel.attributes[0].id );
				theModel2.fetch().done( function() {
					assert.equal( theModel.attributes[0].id, theModel2.get( 'id' ) , 'We should be able to get a ' + className );
					done();
				} );
			} );

		} );

	});
} );

var modelsWithIndexes =
	[
		'Taxonomy',
		'Status',
		'Type'
	];

_.each( modelsWithIndexes, function( className ) {

	QUnit.test( 'Testing ' + className + ' model.' , function( assert ) {
		var done = assert.async();

		assert.expect( 2 );

		wp.api.loadPromise.done( function() {
			var theModel = new wp.api.models[ className ]();
			assert.ok( theModel, 'We can instantiate wp.api.models.' + className );
			theModel.fetch().done( function() {
				var theModel2 = new wp.api.models[ className ]();

				if ( ! _.isUndefined( theModel.attributes[0] ) ) {
					theModel2.set( 'id', theModel.attributes[0].id );
				}

				theModel2.fetch().done( function() {
					assert.notEqual( 0, _.keys( theModel2.attributes ).length , 'We should be able to get a ' + className );
					done();
				} );
			} );

		} );

	});
} );
