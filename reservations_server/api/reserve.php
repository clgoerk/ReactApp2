<?php
  header("Access-Control-Allow-Origin: *");              
  header("Access-Control-Allow-Methods: POST, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type");
  header("Content-Type: application/json");

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
  }

  require_once('../config/config.php');
  require_once('../config/database.php'); 

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    mysqli_close($conn);
    exit();
  }

  // Read JSON body
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);

  if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON body']);
    mysqli_close($conn);
    exit();
  }

  // Validate
  if (empty($data['reservation_id']) || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing reservation_id or action']);
    mysqli_close($conn);
    exit();
  }

  $reservationId = (int)$data['reservation_id'];
  $action = $data['action'];

  if (!in_array($action, ['reserve', 'unreserve'], true)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid action (use "reserve" or "unreserve")']);
    mysqli_close($conn);
    exit();
  }

  $reservedValue = $action === 'reserve' ? 1 : 0;

  $stmt = $conn->prepare("UPDATE reservations SET reserved = ? WHERE id = ?");
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(['message' => 'Prepare failed: ' . mysqli_error($conn)]);
    mysqli_close($conn);
    exit();
  }

  $stmt->bind_param('ii', $reservedValue, $reservationId);

  if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['message' => 'Execute failed: ' . $stmt->error]);
    $stmt->close();
    mysqli_close($conn);
    exit();
  }

  // If no rows changed, check existence and current state
  if ($stmt->affected_rows === 0) {
    $check = $conn->prepare("SELECT reserved FROM reservations WHERE id = ?");
    if ($check) {
      $check->bind_param('i', $reservationId);
      $check->execute();
      $res = $check->get_result();
      if ($res && $res->num_rows === 1) {
        $row = $res->fetch_assoc();
        $check->close();
        $stmt->close();
        echo json_encode([
          'status' => 'success',
          'reservation_id' => $reservationId,
          'reserved' => (int)$row['reserved'],
          'message' => 'No change (already in this state).'
        ]);
        mysqli_close($conn);
        exit();
      }
    }
    http_response_code(404);
    echo json_encode(['message' => 'Reservation not found']);
    $stmt->close();
    mysqli_close($conn);
    exit();
  }

  $stmt->close();

  echo json_encode([
    'status' => 'success',
    'reservation_id' => $reservationId,
    'reserved' => $reservedValue
  ]);

  mysqli_close($conn);