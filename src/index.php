<?php

require_once "metadata.php";

if( !isset( $_GET['scriptid'] ) )
  exit;
else
  $script_id = (int)stripslashes( $_GET['scriptid'] );

if ( !$script_id > 0 )
  exit;

if( isset( $_GET['maxage'] ) )
  $days = (int)( stripslashes( $_GET['maxage'] ) );
else
  $days = 30;

if ( $days < 1 )
  $days = 30;


if ( isset( $_GET["trim"] )
  && ( $_GET["trim"] === "1"
    ||  strtolower( $_GET["trim"] ) === "true"
    ||  strtolower( $_GET["trim"] ) === "yes"
))
  $trim = true;
else
  $trim = false;


switch ( isset( $_GET["open"] ) ? strtolower( $_GET["open"] ) : "GM" ) {
  case 'window':
    $open_method = "window";
    break;
  case 'GM':
  default:
    $open_method = "GM";
    break;
}

$install_uri = "https://userscripts.org/scripts/source/" . $script_id . ".user.js";
$show_uri = "http://userscripts.org/scripts/show/" . $script_id . "/";

switch ( isset( $_GET["method"] ) ? strtolower( $_GET["method"] ) : "show" ) {
  case 'install':
    $default_method = "install";
    break;
  case 'update':
    $default_method = "install";
    $install_uri .= "?update.user.js";
    break;
  case 'show':
  default:
    $default_method = "show";
    break;
}

header( 'Content-Type: application/x-javascript; charset=utf-8' );

require_once 'lib/classes/language.php';

if( isset( $_GET['lang'] ) )
  $uso_language = new USO_language( stripslashes( $_GET['lang'] ) );
else
  $uso_language = new USO_language();

$strings = $uso_language->translate();

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, 'https://userscripts.org/scripts/source/' . $script_id . '.meta.js' );
curl_setopt( $ch, CURLOPT_FAILONERROR, 1 );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
$output = curl_exec( $ch );

if (curl_errno($ch) != 0) {
  curl_close( $ch );
  exit;
}
curl_close( $ch );

preg_match_all( '/@(\S+?)(?::(\S+))?(?:[ \t]+([^\r\n]+)|\s+)/', $output, $meta );

foreach ( $meta[1] as $key => $value ) {
  if ( $meta[2][ $key ] && strlen( $meta[2][ $key ] ) > 0 ) {
    $meta_array[ $value ][ $meta[2][ $key ] ] = $meta[3][ $key ];
    $meta_safe[ $value ][ $meta[2][ $key ] ] = addslashes ( $meta[3][ $key ] );
  }
  else if ( is_string( $meta_array[ $value ] ) ) {
    $meta_array[ $value ] = array(
      $meta_array[ $value ],
      $meta[3][ $key ]
    );
    $meta_safe[ $value ] = array(
      $meta_array[ $value ],
      addslashes( $meta[3][ $key ] )
    );
  }
  else if ( is_array( $meta_array[ $value ] ) ) {
    $meta_array[ $value ][] = $meta[3][ $key ];
    $meta_safe[ $value ][] = addslashes( $meta[3][ $key ] );
  }
  else {
    $meta_array[ $value ] = $meta[3][ $key ];
    $meta_safe[ $value ] = addslashes( $meta[3][ $key ] );
  }
}

$meta = $meta_safe;
$meta_string = json_encode( $meta_array );
unset( $meta_array );

?><?php require_once 'lib/scripts/usocheckup.js' ?>
