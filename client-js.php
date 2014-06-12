<?php
/**
 * Plugin Name: WP-API Client JS
 */

function json_api_client_js() {
	/**
	 * Check if WP API functionality exists. Not using is_plugin_active in prepartion for
	 */
	if ( ! function_exists( 'json_get_url_prefix' ) ) {
		return;
	}

	wp_enqueue_script( 'wp-api-js', plugins_url( 'build/js/wp-api.min.js', __FILE__ ), array( 'jquery', 'underscore', 'backbone' ), '1.0', true );

	$settings = array( 'root' => home_url( json_get_url_prefix() ), 'nonce' => wp_create_nonce( 'wp_json' ) );
	wp_localize_script( 'wp-api-js', 'WP_API_Settings', $settings );
}

if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
	add_action( 'wp_enqueue_scripts', 'json_api_client_js' );
	add_action( 'admin_enqueue_scripts', 'json_api_client_js' );
}