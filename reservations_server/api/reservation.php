<?php
// reservation.php  — GET /reservation.php/{id}  or  /reservation.php?id={id}

session_start();

/* -------- CORS (allow credentials) -------- */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000"); // your React dev origin
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

require_once('../config/config.php');
require_once('../config/database.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
  exit();
}

/* -------- Extract ID from path or query -------- */
$id = 0;

// Try query string first: /reservation.php?id=123
if (isset($_GET['id'])) {
  $id = intval($_GET['id']);
}

if ($id <= 0) {
  // Try path: /reservation.php/123
  $requestUri = $_SERVER['REQUEST_URI'] ?? '';
  // Strip any query string first
  $pathOnly = explode('?', $requestUri, 2)[0];
  $parts = explode('/', trim($pathOnly, '/')); // e.g. ['ReactApp2','reservations_server','api','reservation.php','123']

  // Find 'reservation.php' and read the next segment as ID if present
  $idx = array_search('reservation.php', $parts, true);
  if ($idx !== false && isset($parts[$idx + 1])) {
    $id = intval($parts[$idx + 1]);
  } else {
    // Fallback: maybe the last segment is the id
    $last = end($parts);
    if (ctype_digit($last ?? '')) {
      $id = intval($last);
    }
  }
}

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Missing or invalid reservation id']);
  exit();
}

/* -------- Fetch the reservation -------- */
$stmt = $conn->prepare("SELECT id, location, start_time, end_time, reserved, image_name FROM reservations WHERE id = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows === 1) {
  $row = $result->fetch_assoc();

  // Ensure types are clean
  $payload = [
    'id'         => (int)$row['id'],
    'location'   => $row['location'],
    'start_time' => $row['start_time'], // e.g. "09:00:00"
    'end_time'   => $row['end_time'],
    'reserved'   => (int)$row['reserved'],
    'image_name' => $row['image_name'] ?? 'placeholder_100.jpg',
  ];

  echo json_encode(['status' => 'success', 'data' => $payload]);
} else {
  http_response_code(404);
  echo json_encode(['status' => 'error', 'message' => 'Reservation not found']);
}

$stmt->close();
$conn->close();