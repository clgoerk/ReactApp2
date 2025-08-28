<?php
  header("Content-Type: application/json");

  // Load configuration files
  require_once('../config/config.php');
  require_once('../config/database.php');

  // Define configuration options
  $allowedMethods = ['GET'];
  $maxReservationsPerPage = 6;

  // Implement basic pagination
  $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
  $offset = ($page - 1) * $maxReservationsPerPage;

  // Query to count total reservations
  $countQuery = "SELECT COUNT(*) AS totalReservations FROM reservations";
  $countResult = mysqli_query($conn, $countQuery);

  // Check if total reservations query is successful
  if (!$countResult) {
    http_response_code(500); // internal server error
    echo json_encode(['message' => 'Error querying database for total reservations count: ' . mysqli_error($conn)]);
    mysqli_close($conn);
    exit();
  }

  $countRow = mysqli_fetch_assoc($countResult);
  $totalReservations = $countRow['totalReservations'];

  // Query to get all reservations with pagination and ordering
$query = "SELECT * FROM reservations ORDER BY id ASC LIMIT $offset, $maxReservationsPerPage";
  $result = mysqli_query($conn, $query);

  // Check if get all reservations query is successful
  if (!$result) {
    http_response_code(500); // internal server error
    echo json_encode(['message' => 'Error querying database for paginated reservations: ' . mysqli_error($conn)]);
    mysqli_close($conn);
    exit();
  }

  // Convert query result into an associative array
  $reservations = mysqli_fetch_all($result, MYSQLI_ASSOC);

  // Check if there are reservations
  if (empty($reservations)) {
    http_response_code(404); // not found error
    echo json_encode(['message' => 'No reservations found', 'totalReservations' => $totalReservations]);
  } else {
    // return JSON response including totalReservations
    echo json_encode(['reservations' => $reservations, 'totalReservations' => $totalReservations]);
  }

  // close database connection
  mysqli_close($conn);
?>