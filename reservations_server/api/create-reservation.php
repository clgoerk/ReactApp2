<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

require_once('../config/config.php');
require_once('../config/database.php');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

/* ---- Input presence ---- */
if (!isset($_POST['location'], $_POST['start_time'], $_POST['end_time'])) {
  http_response_code(400);
  echo json_encode(['message' => 'Missing required fields']);
  exit();
}

/* ---- Sanitize (FILTER_SANITIZE_STRING is deprecated) ---- */
$location   = trim(strip_tags($_POST['location']));
$start_time = trim($_POST['start_time']);
$end_time   = trim($_POST['end_time']);

/* ---- Time format validation (HH:MM or HH:MM:SS) ---- */
$timePattern = '/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/';
if (!preg_match($timePattern, $start_time) || !preg_match($timePattern, $end_time)) {
  http_response_code(400);
  echo json_encode(['message' => 'Invalid time format. Use HH:MM or HH:MM:SS (24-hour).']);
  exit();
}

/* Normalize to HH:MM:SS for the TIME columns */
if (strlen($start_time) === 5) $start_time .= ':00';
if (strlen($end_time)   === 5) $end_time   .= ':00';

/* ---- Same-day window check (your DB likely has a CHECK enforcing this) ---- */
$startSec = strtotime("1970-01-01 {$start_time}");
$endSec   = strtotime("1970-01-01 {$end_time}");
if ($endSec <= $startSec) {
  http_response_code(400);
  echo json_encode(['message' => 'End time must be after start time (same day).']);
  exit();
}

/* ---- Optional image upload ---- */
$uploadDir = realpath(__DIR__) . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR;
if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0775, true); }

$imageNameToSave = null;
if (!empty($_FILES['image']['name'])) {
  if (!is_writable($uploadDir)) {
    http_response_code(500);
    echo json_encode(['message' => 'Upload folder not writable']);
    exit();
  }

  // Basic file validation
  $maxBytes = 5 * 1024 * 1024; // 5MB
  if (!empty($_FILES['image']['error']) && $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['message' => 'Upload error code: ' . $_FILES['image']['error']]);
    exit();
  }
  if ($_FILES['image']['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(['message' => 'Image too large (max 5MB).']);
    exit();
  }

  // Check MIME
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime  = $finfo->file($_FILES['image']['tmp_name']);
  $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
  if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['message' => 'Unsupported image type. Use JPG, PNG, GIF, or WEBP.']);
    exit();
  }

  // Keep original name; add suffix if exists
  $originalName = basename($_FILES['image']['name']);
  // (Optional) strip path oddities
  $originalName = preg_replace('/[^\w.\- ]+/', '_', $originalName);

  $target = $uploadDir . $originalName;
  if (file_exists($target)) {
    $dot = strrpos($originalName, '.');
    $base = $dot === false ? $originalName : substr($originalName, 0, $dot);
    $ext  = $dot === false ? '' : substr($originalName, $dot);
    $i = 1;
    do {
      $candidate = $base . "_" . $i . $ext;
      $target = $uploadDir . $candidate;
      $i++;
    } while (file_exists($target));
    $originalName = $candidate;
  }

  if (!move_uploaded_file($_FILES['image']['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to move uploaded file.']);
    exit();
  }

  $imageNameToSave = $originalName;
}

/* ---- Insert row ----
   If no image uploaded, omit image_name so DB default 'placeholder_100.jpg' is used. */
if ($imageNameToSave !== null) {
  $stmt = $conn->prepare(
    'INSERT INTO reservations (location, start_time, end_time, image_name) VALUES (?, ?, ?, ?)'
  );
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(['message' => 'DB prepare failed: ' . $conn->error]);
    exit();
  }
  $stmt->bind_param('ssss', $location, $start_time, $end_time, $imageNameToSave);
} else {
  $stmt = $conn->prepare(
    'INSERT INTO reservations (location, start_time, end_time) VALUES (?, ?, ?)'
  );
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(['message' => 'DB prepare failed: ' . $conn->error]);
    exit();
  }
  $stmt->bind_param('sss', $location, $start_time, $end_time);
}

if ($stmt->execute()) {
  http_response_code(201);
  echo json_encode([
    'message'   => 'Reservation created successfully',
    'id'        => $stmt->insert_id,
    'imageName' => $imageNameToSave ?? 'placeholder_100.jpg'
  ]);
} else {
  http_response_code(500);
  echo json_encode(['message' => 'Error creating reservation: ' . $stmt->error]);
}

$stmt->close();
$conn->close();