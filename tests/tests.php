<!DOCTYPE html>
<html>
<head>

    <meta charset="utf-8">
    <title>WP-API JAVASCRIPT MODEL TESTS</title>

    <!-- Load local QUnit. -->
    <link rel="stylesheet" href="../bower_components/qunit/qunit/qunit.css" media="screen">
    <script src="../bower_components/qunit/qunit/qunit.js"></script>

    <!-- Load dependencies -->
    <script src="../bower_components/jquery/dist/jquery.js" type="text/javascript"></script>
    <script src="../bower_components/jquery-migrate/jquery-migrate.js" type="text/javascript"></script>

    <script type="text/javascript">
	/* <![CDATA[ */
	var WP_API_Settings = {"root":"\/wp-json\/","nonce":""};
	/* ]]> */
	</script>    </script>

</head>
<body>

    <h1 id="qunit-header">WP-API JAVASCRIPT MODEL TESTS</h1>
    <h2 id="qunit-banner"></h2>
    <div id="qunit-testrunner-toolbar"></div>
    <h2 id="qunit-userAgent"></h2>
    <ol id="qunit-tests"></ol>

    <!-- Load dependencies -->
    <script src="../bower_components/underscore/underscore.js" type="text/javascript"></script>
    <script src="../bower_components/backbone/backbone.js" type="text/javascript"></script>



    <!-- Load local lib and tests. -->
    <script src="../build/js/wp-api.js"></script>
    <script src="wp-api-tests.js"></script>

    </body>
</html>
<?php

function wp_verify_nonce() {
	return true;
}
