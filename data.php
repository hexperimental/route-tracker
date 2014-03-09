<?php

$files = array();

//Read files from tracks directory.
$dir = './gpx';
if ($handle = opendir( $dir )) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != "..") {
            $files[]= $dir . '/' . $entry;
        }
    }
    closedir($handle);
}
print json_encode( $files );

?>
