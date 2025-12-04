<?php

ini_set('display_errors', 0);             
ini_set('display_startup_errors', 0);
header('Content-Type: application/json; charset=utf-8');

require 'connect.php';

/*
   Struktur tabel covid19_recap:
   - date        (varchar, contoh: 1/3/2020)
   - newcases    (int)
*/

$sql = "
    SELECT 
        `date` AS time,
        SUM(newcases) AS totalNewCases
    FROM covid19_recap
    GROUP BY `date`
    ORDER BY STR_TO_DATE(`date`, '%m/%e/%Y')
";

$result = $conn->query($sql);

$data = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            "time"          => $row["time"],          
            "totalNewCases" => (int)$row["totalNewCases"],
        ];
    }
    echo json_encode($data);
} else {
    http_response_code(500);
    echo json_encode([
        "error"   => "SQL error",
        "message" => $conn->error
    ]);
}

$conn->close();
