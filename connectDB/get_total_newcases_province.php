<?php
header('Content-Type: application/json');

require 'connect.php';   

if (!$conn) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$sql = "
    SELECT 
        province,
        SUM(newcases) AS totalNewCases
    FROM covid19_recap
    WHERE province IS NOT NULL AND province <> ''
    GROUP BY province
    ORDER BY totalNewCases DESC
";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['error' => $conn->error]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'province'      => $row['province'],
        'totalNewCases' => (int)$row['totalNewCases'],
    ];
}

echo json_encode($data);
