<?php
session_start();

// CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Require auth
if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(["success" => false, "message" => "Unauthorized"]);
  exit();
}

// Admin only
if (($_SESSION['user']['role'] ?? '') !== 'admin') {
  http_response_code(403);
  echo json_encode(["success" => false, "message" => "Forbidden: Admins only"]);
  exit();
}

require_once('../config/config.php');
require_once('../config/database.php');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["success" => false, "message" => "Invalid request method."]);
  exit();
}

// Accept JSON or form data
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (isset($data['id'])) {
  $id = intval($data['id']);
} elseif (isset($_POST['id'])) {
  $id = intval($_POST['id']);
} else {
  $id = 0;
}

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "Invalid reservation ID."]);
  exit();
}

/* Optional: fetch image name to delete file after row removal */
$imageName = null;
$select = $conn->prepare("SELECT image_name FROM reservations WHERE id = ?");
$select->bind_param("i", $id);
$select->execute();
$selectRes = $select->get_result();
if ($row = $selectRes->fetch_assoc()) {
  $imageName = $row['image_name'] ?? null;
}
$select->close();

/* Delete reservation row */
$stmt = $conn->prepare("DELETE FROM reservations WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
  $stmt->close();

  // Best effort: remove uploaded image if not the placeholder
  if (!empty($imageName) && $imageName !== 'placeholder_100.jpg') {
    $uploadDir = __DIR__ . "/uploads/";
    $path = $uploadDir . $imageName;
    if (is_file($path)) {
      @unlink($path); // ignore errors
    }
  }

  echo json_encode(["success" => true, "message" => "Reservation deleted successfully."]);
} else {
  $err = $stmt->error;
  $stmt->close();
  http_response_code(500);
  echo json_encode(["success" => false, "message" => "Failed to delete reservation.", "error" => $err]);
}

$conn->close();