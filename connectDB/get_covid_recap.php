<?php

header('Content-Type: application/json');

require 'connect.php';   // bikin $conn (mysqli)

if (!$conn) {
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

/*
   Aggregate per provinsi:
   - totalCases     = SUM(newcases)
   - totalDeaths    = SUM(newdeaths)
   - totalRecovered = SUM(newrecovered)
*/
$sql = "
    SELECT
        location AS province,
        SUM(newcases)     AS totalCases,
        SUM(newdeaths)    AS totalDeaths,
        SUM(newrecovered) AS totalRecovered,
        MAX(longitude)    AS longitude,
        MAX(latitude)     AS latitude
    FROM covid19_recap
    WHERE location IS NOT NULL AND location <> ''
    GROUP BY location
    ORDER BY location
";

$result = $conn->query($sql);
if (!$result) {
    echo json_encode(['error' => $conn->error]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'province'       => $row['province'],
        'totalCases'     => (int)$row['totalCases'],
        'totalDeaths'    => (int)$row['totalDeaths'],
        'totalRecovered' => (int)$row['totalRecovered'],
        'longitude'      => $row['longitude'] !== null ? (float)$row['longitude'] : null,
        'latitude'       => $row['latitude']  !== null ? (float)$row['latitude']  : null,
    ];
}

echo json_encode($data);
