<?php
date_default_timezone_set('UTC');
$host = 'localhost';
$user = 'root';
$pass = 'root';
$db   = 'chat_db';

$mysqli = new mysqli($host, $user, $pass, $db);

if ($mysqli->connect_errno) {
    die('(!) Ошибка соединения: ' . $mysqli->connect_error);
}

$mysqli->query("SET time_zone = '+00:00'");
$mysqli->set_charset('utf8mb4');
?>