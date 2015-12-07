<?php
/**
 * Plugin Name: WP-API Client JS
 */

function json_api_client_js() {

	wp_enqueue_script( 'wp-api', plugins_url( 'build/js/wp-api.js', __FILE__ ), array( 'jquery', 'underscore', 'backbone' ), '1.0', true );

	$settings = array( 'root' => esc_url_raw( get_rest_url() ), 'nonce' => wp_create_nonce( 'wp_rest' ) );
	wp_localize_script( 'wp-api', 'WP_API_Settings', $settings );
}

if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
	add_action( 'wp_enqueue_scripts', 'json_api_client_js' );
	add_action( 'admin_enqueue_scripts', 'json_api_client_js' );
}