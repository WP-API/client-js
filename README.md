Backbone library for the WordPress REST API or "WP-API"
==============

## Summary

This library provides an interface for the [WP REST API](https://github.com/WP-API/WP-API) by providing Backbone Models and Collections for all endpoints in the API.

## Using

Activate the WP-API plugin. Enqueue the script directly:

```
wp_enqueue_script( 'wp-api' );
```

or as a dependency for your script:

```
wp_enqueue_script( 'my_script', 'path_to_my_script', array( 'wp-api' ) );
```

The library parses the root endpoint (the 'Schema') and creates matching Backbone models and collections. You will now have two root objects available to you: `wp.api.models` and `wp-api.collections`.

These objects contain the following:
```
Models:
  * Categories
  * Comments
  * Customposttype
  * Media
  * Pages
  * PagesMeta
  * PagesRevisions
  * Posts
  * PostsCategories
  * PostsMeta
  * PostsRevisions
  * PostsTags
  * Schema
  * Statuses
  * Tags
  * Taxonomies
  * Types
  * Users

Collections:
  * Categories
  * Comments
  * Customposttype
  * Me // @note: should be model, see [issue](https://github.com/WP-API/client-js/issues/54)
  * Media
  * Meta
  * Pages
  * Posts
  * Revisions
  * Statuses
  * Tags
  * Taxonomies
  * Types
  * Users
```

You can use these endpoints to read, update, create and delete items using standard Backbone methods (fetch, sync, save & destroy for models, sync for collections). You should extend these objects to make them your own, and build your views on top of them.

For example, to create a post, make sure you are logged in then:

```
var post = new wp.api.models.Posts( { title: 'This is a test post' } );
post.save();
```

Each model and collection includes a reference to its default values, for example `wp.api.models.Posts` is:

```
wp.api.models.Posts.defaults
 * author: null
 * comment_status: null
 * content: null
 * date: null
 * date_gmt: null
 * excerpt: null
 * featured_image: null
 * format: null
 * modified: null
 * modified_gmt: null
 * password: null
 * ping_status: null
 * slug: null
 * status: null
 * sticky: null
 * title: null
```

Each model and collection contains a list of options the corrosponding endpoint accepts (passed as a second parameter), for example `wp.api.collections.Posts.options`:

```
wp.api.collections.Posts.options
 * author
 * context
 * filter
 * order
 * orderby
 * page
 * per_page
 * search
 * status
```

to get the last 10 posts:

```
var postsCollection = new wp.api.collections.Posts();
postsCollection.fetch();
```

to get the last 25 posts:

```
var postsCollection = new wp.api.collections.Posts( {}. { per_page: '25' } );
postsCollection.fetch();
```

All collections support pagination automatically, and you can get the next page of results using `more`:

```
postsCollection.more();
```

If you add custom endpoints to the api they will also become available as models/collections. For example, you will get new models and collections when you [add REST API support to your custom post type](http://v2.wp-api.org/extending/custom-content-types/). Note that you may need to open a new tab to get a new read of the Schema.

## Development

To develop, build and test this library, you must have [Node](http://nodejs.org) installed. For Windows users, simply [download](http://nodejs.org/download/) and install Node. For Mac users, we recommend installing Node using [Homebrew](http://mxcl.github.com/homebrew/). Once Homebrew is installed, run `brew install node` to install Node.js.

### Installation

Clone this repository, and then execute the following commands within the checkout directory:
```bash
$ npm install
```
This will use Node's NPM package manager to install all the dependencies for building and testing this library. We use [Bower](http://bower.io) to manage client script dependencies, but Bower script installation is handled as part of the `npm install` command.

### Building

To update the compiled JavaScript files in the `build/` directory after you've made changes, run the library's `build` script with the npm command:
```bash
$ npm run build
```
This will use [Grunt](http://gruntjs.com) to check the source scripts in `js/` for syntax errors, then concatenate and minify them to create [the minified wp-api.min.js file](build/js/wp-api.min.js) and a corresponding source map file.

### Testing

You can run the unit tests for this library using Grunt:
```bash
$ npm test
```

#### A note on Grunt

The custom "build" and "test" scripts defined in this library's [package.json](package.json) enable access to Grunt's functionality after a simple `npm install`; however, these commands can also be run directly using Grunt itself. In order to gain access to the `grunt` console command, you must globally install the Grunt command-line interface:
```bash
$ npm install -g grunt-cli
```
Once `grunt-cli` has been installed, you can run the build and test commands with `grunt` and `grunt test`, respectively, without having to invoke the scripts via NPM.
