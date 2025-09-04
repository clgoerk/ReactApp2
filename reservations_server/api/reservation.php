<?php
header("Content-Type: application/json");

require_once('../config/config.php');
require_once('../config/database.php');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  // Extract numeric id from URL like .../reservation.php/123
  $requestUri = $_SERVER['REQUEST_URI'];
  $parts = explode('/', $requestUri);
  $id = intval(end($parts));

  $sql = "SELECT id, location, start_time, end_time, reserved, image_name
          FROM reservations
          WHERE id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('i', $id);
  $stmt->execute();
  $res = $stmt->get_result();

  if ($res && $res->num_rows === 1) {
    $row = $res->fetch_assoc();

    echo json_encode([
      'status' => 'success',
      'data' => [
        'id'         => (int)$row['id'],
        'location'   => $row['location'],
        'start_time' => $row['start_time'],
        'end_time'   => $row['end_time'],
        'reserved'   => (int)$row['reserved'],   // 1 or 0
        'image_name' => $row['image_name'],      // <<— now included
      ],
    ]);
  } else {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Reservation not found']);
  }

  $stmt->close();
  $conn->close();
  exit;
}

// If not GET
http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
exit;