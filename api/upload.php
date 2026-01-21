<?php
// Разрешаем запросы с вашего поддомена на Vercel
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$target_dir = "../temp/";
if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);

// Создаем уникальное имя файла
$file_name = time() . "_" . uniqid() . ".jpg";
$target_file = $target_dir . $file_name;

if (move_uploaded_file($_FILES["photo"]["tmp_name"], $target_file)) {
    echo json_encode([
        "status" => "success",
        "fileUrl" => "https://app.vidiai.top/temp/" . $file_name
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error"]);
}
