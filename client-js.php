<?php
/**
 * Plugin Name: WP-API Client JS.
 *
 * Version 1.0.1
 */

/**
 * Set up the REST API server and localize the schema.
 */
function json_api_client_js() {

	/**
	 * @var WP_REST_Server $wp_rest_server
	 */
	global $wp_rest_server;

	// Ensure that the wp-api script is registered.
	$scripts = wp_scripts();
	$src = plugins_url( 'build/js/wp-api.js', __FILE__ );
	if ( isset( $scripts->registered['wp-api'] ) ) {
		$scripts->registered['wp-api']->src = $src;
	} else {
		wp_register_script( 'wp-api', $src, array( 'jquery', 'underscore', 'backbone' ), '1.0', true );
	}

	// Ensure the rest server is intialized.
	if ( empty( $wp_rest_server ) ) {
		/** This filter is documented in wp-includes/rest-api.php */
		$wp_rest_server_class = apply_filters( 'wp_rest_server_class', 'WP_REST_Server' );
		$wp_rest_server       = new $wp_rest_server_class();

		/** This filter is documented in wp-includes/rest-api.php */
		do_action( 'rest_api_init', $wp_rest_server );
	}

	// Search for the OAuth1 authentication, and add any info to localized data.
	$oauth_request = new WP_REST_Request( 'GET', '/' );
	$oauth_response = $wp_rest_server->dispatch( $oauth_request );
	$oauth1 = null;

	if ( ! $oauth_response->is_error() ) {
		$oauth_data = $oauth_response->get_data();

		if ( isset(  $oauth_data['authentication']['oauth1'] ) ) {
			$oauth1 =  $oauth_data['authentication']['oauth1'];
		}
	}

	// Set up OAuth if available.
	if ( $oauth1 ) {
		wp_enqueue_script( 'sha1', plugins_url( 'vendor/js/hmac-sha1.js', __FILE__ ), array()  );
		wp_enqueue_script( 'sha256', plugins_url( 'vendor/js/hmac-sha256.js', __FILE__ ), array()  );
		wp_enqueue_script( 'base64', plugins_url( 'vendor/js/enc-base64-min.js', __FILE__ ), array()  );
		wp_enqueue_script( 'oauth1', plugins_url( 'vendor/js/oauth-1.0a.js', __FILE__ ), array( 'base64', 'sha1', 'sha256' )  );
	}


	$scripts = wp_scripts();
	$src = plugins_url( 'build/js/wp-api.js', __FILE__ );
	if ( isset( $scripts->registered['wp-api'] ) ) {
		$scripts->registered['wp-api']->src = $src;
	} else {
		wp_register_script( 'wp-api', $src, array( 'jquery', 'underscore', 'backbone' ), '1.0', true );
	}



	$schema_request  = new WP_REST_Request( 'GET', '/wp/v2' );
	$schema_response = $wp_rest_server->dispatch( $schema_request );
	$schema = null;
	if ( ! $schema_response->is_error() ) {
		$schema = $schema_response->get_data();
	}

	// Localize the plugin settings and schema.
	$settings = array(
		'root'          => esc_url_raw( get_rest_url() ),
		'nonce'         => wp_create_nonce( 'wp_rest' ),
		'versionString' => 'wp/v2/',
		'schema'        => $schema,
		'cacheSchema'   => true,
		'oauth1Token'    => isset( $_GET['oauth_token'] ) ? sanitize_text_field( $_GET['oauth_token'] ) : null,
		'oauth1Verifier' => isset( $_GET['oauth_verifier'] ) ? sanitize_text_field( $_GET['oauth_verifier'] ) : null,
		'oauth1Public'    => '0XKFJPpIuBWR',
		'oauth1Secret'    => 'SFh0EqddY1dwhiq2G7GvExEQdMY89TyT0C05qpQELJPFlS7R',
		'loggedInCookie'  => LOGGED_IN_COOKIE
	);

	/**
	 * Filter the JavaScript Client settings before localizing.
	 *
	 * Enables modifying the config values sent to the JS client.
	 *
	 * @param array  $settings The JS Client settings.
	 */
	$settings = apply_filters( 'rest_js_client_settings', $settings );
	wp_localize_script( 'wp-api', 'wpApiSettings', $settings );

}

	add_action( 'wp_enqueue_scripts', 'json_api_client_js' );
	add_action( 'admin_enqueue_scripts', 'json_api_client_js' );
