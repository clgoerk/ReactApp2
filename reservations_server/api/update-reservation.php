<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once('../config/config.php');
require_once('../config/database.php');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Require auth (same pattern as blog)
if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(["success" => false, "message" => "Unauthorized"]);
  exit();
}

// Admin only (same as blog)
if ($_SESSION['user']['role'] !== 'admin') {
  http_response_code(403);
  echo json_encode(["success" => false, "message" => "Forbidden: Admins only"]);
  exit();
}

// Validate POST data (multipart/form-data)
if (!isset($_POST['id'], $_POST['location'], $_POST['start_time'], $_POST['end_time'])) {
  http_response_code(400);
  echo json_encode(['message' => 'Missing required fields']);
  exit();
}

$id         = intval($_POST['id']);
$location   = filter_var($_POST['location'], FILTER_SANITIZE_STRING);
$start_time = filter_var($_POST['start_time'], FILTER_SANITIZE_STRING);
$end_time   = filter_var($_POST['end_time'], FILTER_SANITIZE_STRING);

// Normalize HH:MM to HH:MM:SS (like your earlier helpers)
if (preg_match('/^\d{2}:\d{2}$/', $start_time)) $start_time .= ':00';
if (preg_match('/^\d{2}:\d{2}$/', $end_time))   $end_time   .= ':00';

// Optional image upload
$uploadDir = __DIR__ . "/uploads/";
$imageName = null;

if (!empty($_FILES['image']['name'])) {
  if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0755, true); }

  $originalName   = basename($_FILES['image']['name']);
  $targetFilePath = $uploadDir . $originalName;

  if (!move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error uploading file', 'php_error' => $_FILES['image']['error'] ?? 'unknown']);
    exit();
  }

  $imageName = $originalName;
}

// Update row
if ($imageName) {
  $stmt = $conn->prepare("UPDATE reservations SET location=?, start_time=?, end_time=?, image_name=? WHERE id=?");
  $stmt->bind_param("ssssi", $location, $start_time, $end_time, $imageName, $id);
} else {
  $stmt = $conn->prepare("UPDATE reservations SET location=?, start_time=?, end_time=? WHERE id=?");
  $stmt->bind_param("sssi", $location, $start_time, $end_time, $id);
}

if ($stmt->execute()) {
  echo json_encode(['success' => true, 'message' => 'Reservation updated successfully']);
} else {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Error updating reservation: ' . $stmt->error]);
}

$stmt->close();
$conn->close();