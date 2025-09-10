<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once('../config/config.php');
require_once('../config/database.php');

/* --- CORS preflight --- */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

/* --- Require POST --- */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["success" => false, "message" => "Method not allowed"]);
  exit;
}

/* --- Parse JSON body --- */
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!isset($data['userName'], $data['password'])) {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "Missing fields"]);
  exit;
}

$userName = trim($data['userName']);
$password = (string)$data['password'];

if ($userName === '' || $password === '') {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "Username and password are required"]);
  exit;
}

/* --- Lookup user --- */
$stmt = $conn->prepare("
  SELECT registrationID, userName, password, emailAddress, role
  FROM registrations
  WHERE userName = ?
  LIMIT 1
");
$stmt->bind_param("s", $userName);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
  if (password_verify($password, $row['password'])) {
    // Prevent session fixation
    session_regenerate_id(true);

    $_SESSION['user'] = [
      "registrationID" => (int)$row['registrationID'],
      "userName"       => $row['userName'],
      "emailAddress"   => $row['emailAddress'],
      "role"           => $row['role'],
    ];

    echo json_encode([
      "success" => true,
      "message" => "Login successful",
      "user"    => $_SESSION['user'],
      "role"    => $_SESSION['user']['role']
    ]);
  } else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid username or password"]);
  }
} else {
  http_response_code(401);
  echo json_encode(["success" => false, "message" => "Invalid username or password"]);
}

$stmt->close();
$conn->close();