<?php
// get_donut_totals.php
// Mengembalikan totalRecovered & totalDeaths dari tabel covid19_recap

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
header('Content-Type: application/json; charset=utf-8');

require 'connect.php';   // pastikan file db.php sudah benar

/*
   Struktur tabel covid19_recap (yang penting):
   - totalRecovered (int)
   - totalDeaths    (int)
*/

$sql = "
    SELECT 
        SUM(totalRecovered) AS totalRecovered,
        SUM(totalDeaths)    AS totalDeaths
    FROM covid19_recap
";

$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {
    echo json_encode([
        "totalRecovered" => (int)$row["totalRecovered"],
        "totalDeaths"    => (int)$row["totalDeaths"]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "error"   => "SQL error",
        "message" => $conn->error
    ]);
}

$conn->close();
