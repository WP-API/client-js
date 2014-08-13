Backbone.js App for JSON REST API
==============

This library provides a client-side interface for the [JSON REST API](https://github.com/WP-API/WP-API) plugin for WordPress. This code in this repository generates the Backbone JavaScript application that pairs with JSON REST API. Using this library, you can interact with WordPress installations that have JSON REST API installed using Backbone Models and Collections. Learn more about Backbone [here](http://backbonejs.org/).

## Usage

### Setup
The compiled JavaScript is included by JSON REST API by default. Compiled code is pulled into Github Pages which is enqueued by JSON REST API. That being said, this repository is setup as a WordPress plugin for development purposes. You can activate this plugin along side JSON REST API, and they will play nice together. The Client JS will dequeue the Github Pages version of the code and enqueue it's own. 

### Examples
The Backbone library supplies you with some Backbone models and collections for each route in the JSON REST API. A model
represents a single object such as a post. A collection represents a group of objects. We can use a model to pull a
specific post from a WordPress installation:

```javascript
var post = new wp.api.models.Post( { ID: 1 } );

post.fetch().done( function() {
    // post.attributes contain the attributes of the post
    console.log( post.attributes );
});
```

We can also grab a collection of posts:

```javascript
var posts = new wp.api.collections.Posts();

posts.fetch().done( function() {
    posts.each( function( post ) {
        // post.attributes contain the attributes of the post
        console.log( post.attributes );
    });
});
```

Requests are broken up into pages based on how posts_per_page is set or filtered. Therefore, sometimes we need to
paginate through a collection:

```javascript
var posts = new wp.api.collections.Posts();

posts.fetch().done( function() {
    posts.each( function( post ) {
        // post.attributes contain the attributes of the post
        console.log( post.attributes );
    });

    if ( posts.hasMore() ) {
        posts.more().done( function() {
            posts.each( function( post ) {
                // post.attributes contain the attributes of the post
                console.log( post.attributes );
            });
        });
    }
});
```

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

You can run the QUnit tests for this library using Grunt:
```bash
$ npm test
```

#### A note on Grunt

The custom "build" and "test" scripts defined in this library's [package.json](package.json) enable access to Grunt's functionality after a simple `npm install`; however, these commands can also be run directly using Grunt itself. In order to gain access to the `grunt` console command, you must globally install the Grunt command-line interface:
```bash
$ npm install -g grunt-cli
```
Once `grunt-cli` has been installed, you can run the build and test commands with `grunt` and `grunt test`, respectively, without having to invoke the scripts via NPM.
