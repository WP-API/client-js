<?php
/**
 * Plugin Name: WP-API Client JS
 */

function json_api_client_js() {

	$scripts = wp_scripts();
	$src = plugins_url( 'build/js/wp-api.js', __FILE__ );
	if ( isset( $scripts->registered['wp-api'] ) ) {
		$scripts->registered['wp-api']->src = $src;
	} else {
		wp_register_script( 'wp-api', $src, array( 'jquery', 'underscore', 'backbone' ), '1.0', true );
	}


	$client_has_schema = false;
	if ( false !== ( $schema_hash = get_transient( 'api-schema-hash-cache' ) ) ) {
		if ( isset( $_COOKIE['api-schema-hash'] ) && $schema_hash == $_COOKIE['api-schema-hash'] ) {
			$client_has_schema = true;
		}
	}

	$schema = null;

	if ( ! $client_has_schema ) {

		/**
		 * @var \WP_REST_Server $wp_rest_server
		 */
		global $wp_rest_server;
		if ( empty( $wp_rest_server ) ) {
			/** This filter is documented in wp-includes/rest-api.php */
			$wp_rest_server_class = apply_filters( 'wp_rest_server_class', 'WP_REST_Server' );
			$wp_rest_server = new $wp_rest_server_class();

			/** This filter is documented in wp-includes/rest-api.php */
			do_action( 'rest_api_init', $wp_rest_server );
		}

		$schema_request = new WP_REST_Request( 'GET', '/wp/v2' );
		$schema_response = $wp_rest_server->dispatch( $schema_request );

		// Check to see if the request contains a schema hash cookie matching the cached hash.
		if ( ! $schema_response->is_error() ) {
			$schema = $schema_response->get_data();
		}
		$schema_hash = md5( json_encode( $schema ) );

		// Cache the schema hash for up to an hour.
		set_transient( 'api-schema-hash-cache', $schema_hash, 60 * MINUTE_IN_SECONDS );
	}

	$settings = array(
		'root'          => esc_url_raw( get_rest_url() ),
		'nonce'         => wp_create_nonce( 'wp_rest' ),
		'versionString' => 'wp/v2/',
		'schema'        => $schema,
		'schemaHash'    => $schema_hash,
	);
	wp_localize_script( 'wp-api', 'wpApiSettings', $settings );

}

if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
	add_action( 'wp_enqueue_scripts', 'json_api_client_js' );
	add_action( 'admin_enqueue_scripts', 'json_api_client_js' );
}