Backbone.js App for WP-API
==============

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
