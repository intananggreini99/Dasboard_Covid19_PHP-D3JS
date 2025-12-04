<?php
header("Content-Type: application/json");
include "connect.php";

$sql = "SELECT SUM(newCases) AS total_cases FROM covid19_recap";
$result = $conn->query($sql);

if ($result) {
    $row = $result->fetch_assoc();
    echo json_encode($row);
} else {
    echo json_encode(["error" => "Query failed"]);
}

$conn->close();
?>
