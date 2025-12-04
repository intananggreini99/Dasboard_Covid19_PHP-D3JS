<?php

$host = "localhost";
$user = "root";        // user default XAMPP
$pass = "";            // password database
$db   = "db_covid19";  // nama database

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>
