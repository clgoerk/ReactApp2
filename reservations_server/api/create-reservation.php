<?php

header("Access-Control-Allow-Origin: *");  
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once('../config/config.php');
require_once('../config/database.php');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
  http_response_code(200);
  exit();
}

// retrieve the request body as a string
$request_body = file_get_contents('php://input'); 

// Decode the JSON data into a PHP array
$data = json_decode($request_body, true);

// Validate input fields with basic validation
if (empty($data['location']) || empty($data['start_time']) || empty($data['end_time'])) {
  http_response_code(400);
  echo json_encode(['message' => 'Error: Missing or empty required parameter']);
  exit();
}

// Validate input fields
if (!isset($data['location']) || !isset($data['start_time']) || !isset($data['end_time'])) {
  http_response_code(400);
  die(json_encode(['message' => 'Error: Missing required parameter']));
}

// Sanitize input
$location   = filter_var($data['location'], FILTER_SANITIZE_STRING);
$start_time = filter_var($data['start_time'], FILTER_SANITIZE_STRING); 
$end_time   = filter_var($data['end_time'], FILTER_SANITIZE_STRING);   

// Prepare statement
$stmt = $conn->prepare('INSERT INTO reservations (location, start_time, end_time) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $location, $start_time, $end_time);

// Execute statement
if ($stmt->execute()) {
  $id = $stmt->insert_id;

  // Return success response
  http_response_code(201);
  echo json_encode(['message' => 'Reservation created successfully', 'id' => $id]);
} else {
  // Return error response with more detail if possible
  http_response_code(500);
  echo json_encode(['message' => 'Error creating reservation: ' . $stmt->error]);
}

$stmt->close();
$conn->close();

?>