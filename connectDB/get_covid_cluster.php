<?php

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
header('Content-Type: application/json; charset=utf-8');

require 'connect.php';  

$data = [];

$sql = "
    SELECT
        province,
        totalCases,
        totalDeaths,
        totalRecovered,
        cluster
    FROM covid19_cluster
    ORDER BY cluster ASC, province ASC
";

$result = $conn->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            "province"        => $row["province"],
            "totalCases"      => (float)$row["totalCases"],
            "totalDeaths"     => (float)$row["totalDeaths"],
            "totalRecovered"  => (float)$row["totalRecovered"],
            "cluster"         => (int)$row["cluster"],
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