module( 'WP-API JS Client Tests' );

QUnit.test( 'API Loaded correctly', function( assert ) {
	var done = assert.async();

	assert.expect( 2 );
	assert.ok( wp.api.loadPromise );

	wp.api.loadPromise.done( function() {
		assert.ok( wp.api.models );
		done();
	} );

} );

// Test custom namespaces are parsed correctly.
wp.api.init( {
	'versionString': 'js-widgets/v1/'
} )
	.done( function() {
		var customModels = [
			'WidgetsText',
			'WidgetsRecentPosts',
			'WidgetsPostCollection'
		];

		// Check that we have and can get each model type.
		_.each( customModels, function( className ) {
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

var collectionHelperTests = [
	{
		'collectionType':   'Posts',
		'returnsModelType': 'post',
		'supportsMethods':  {
			'getDate':          'getDate',
			'getRevisions':     'getRevisions',
			'getTags':          'getTags',
			'getCategories':    'getCategories',
			'getAuthorUser':    'getAuthorUser',
			'getFeaturedMedia': 'getFeaturedMedia'
			/*'getMeta':        'getMeta', currently not supported */
		}
	},
	{
		'collectionType':   'Pages',
		'returnsModelType': 'page',
		'supportsMethods':  {
			'getDate':          'getDate',
			'getRevisions':     'getRevisions',
			'getAuthorUser':    'getAuthorUser',
			'getFeaturedMedia': 'getFeaturedMedia'
		}
	}
];

// Check that we have and can get each collection type.
_.each( collectionClassNames, function( className ) {
	QUnit.test( 'Testing ' + className + ' collection.', function( assert ) {
		var done = assert.async();

		wp.api.loadPromise.done( function() {
			var theCollection = new wp.api.collections[ className ]();
			assert.ok(
				theCollection,
				'We can instantiate wp.api.collections.' + className
			);
			theCollection.fetch().done( function() {
				assert.equal(
					1,
					theCollection.state.currentPage,
					'We should be on page 1 of the collection in ' + className
				);

					// Should this collection have helper methods?
					var collectionHelperTest = _.findWhere( collectionHelperTests, { 'collectionType': className } );

					// If we found a match, run the tests against it.
					if ( ! _.isUndefined( collectionHelperTest ) ) {

						// Test the first returned model.
						var firstModel = theCollection.at( 0 );

						// Is the model the right type?
						assert.equal(
							collectionHelperTest.returnsModelType,
							firstModel.get( 'type' ),
							'The wp.api.collections.' + className + ' is of type ' + collectionHelperTest.returnsModelType
						);

						// Does the model have all of the expected supported methods?
						_.each( collectionHelperTest.supportsMethods, function( method ) {
							assert.equal(
								'function',
								typeof firstModel[ method ],
								className + '.' + method + ' is a function.'
							);
						} );
					}


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

// Check that we have and can get each model type.
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

// Check that we have and can get each model type.
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

// Check that getAuthorUser handles errors when the callback fails.
QUnit.test( 'Testing getAuthorUser ajax failure.' , function( assert ) {
	var done = assert.async();

	assert.expect( 1 );

	wp.api.loadPromise.done( function() {
		var post = new wp.api.models.Post( { 'id': 1 } );
		post.fetch().done( function() {

			var originalFetch = window.Backbone.Model.prototype.fetch;

			// Override Backbone.Model.fetch to force an error.
			window.Backbone.Model.prototype.fetch = function( options ) {
				var deferred = jQuery.Deferred(),
					promise  = deferred.promise();

				if ( options.error ) {
					assert.equal( 1, 1 , 'getAuthorUser should have error callback on failure.' );
					done();
				} else {
					assert.equal( 1, 0 , 'getAuthorUser should have error callback on failure.' );
					done();
				}

				deferred.reject();
				return promise;
			};

			post.getAuthorUser();
			window.Backbone.Model.prototype.fetch = originalFetch;
		} );
	} );
} );
