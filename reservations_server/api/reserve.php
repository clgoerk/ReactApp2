<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once('../config/config.php');
require_once('../config/database.php');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Parse JSON input
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$reservation_id = $data['reservation_id'] ?? null;
$action = $data['action'] ?? null;

// Validate
if (!$reservation_id) {
  http_response_code(400);
  echo json_encode(["status"=>"error", "message"=>"Missing reservation id"]);
  exit();
}
if (!in_array($action, ['reserve','unreserve'], true)) {
  http_response_code(400);
  echo json_encode(["status"=>"error", "message"=>"Invalid action"]);
  exit();
}

$newReserved = ($action === 'reserve') ? 1 : 0;

// Update DB
$stmt = $conn->prepare("UPDATE reservations SET reserved=? WHERE id=?");
$stmt->bind_param("ii", $newReserved, $reservation_id);

if ($stmt->execute()) {
  echo json_encode(["status"=>"success","message"=>"Reservation updated","reserved"=>$newReserved]);
} else {
  http_response_code(500);
  echo json_encode(["status"=>"error","message"=>"DB error: ".$stmt->error]);
}

$stmt->close();
$conn->close();