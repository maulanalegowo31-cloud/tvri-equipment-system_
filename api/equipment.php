<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = explode('/', $path);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['type'])) {
                // Get equipment by type
                $type = $_GET['type'];
                $stmt = $pdo->prepare("SELECT * FROM equipment WHERE type = ? AND status = 'available' AND `condition` != 'Rusak' ORDER BY name");
                $stmt->execute([$type]);
                $equipment = $stmt->fetchAll();
                sendResponse($equipment);
            } elseif (isset($_GET['available'])) {
                // Get available equipment only
                $stmt = $pdo->prepare("SELECT * FROM equipment WHERE status = 'available' AND `condition` != 'Rusak' ORDER BY type, name");
                $stmt->execute();
                $equipment = $stmt->fetchAll();
                sendResponse($equipment);
            } else {
                // Get all equipment
                $stmt = $pdo->prepare("SELECT * FROM equipment ORDER BY type, name");
                $stmt->execute();
                $equipment = $stmt->fetchAll();
                sendResponse($equipment);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                sendError('Data tidak valid');
            }
            
            $id = bin2hex(random_bytes(16));
            $stmt = $pdo->prepare("INSERT INTO equipment (id, serial_number, name, type, `condition`, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $input['serial_number'] ?? '',
                $input['name'],
                $input['type'],
                $input['condition'],
                $input['notes'] ?? '',
                $input['status'] ?? 'available'
            ]);
            
            // Get the created equipment
            $stmt = $pdo->prepare("SELECT * FROM equipment WHERE id = ?");
            $stmt->execute([$id]);
            $equipment = $stmt->fetch();
            
            sendResponse($equipment, 201);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
            
            if (!$id) {
                sendError('ID equipment tidak ditemukan');
            }
            
            $stmt = $pdo->prepare("UPDATE equipment SET status = ?, `condition` = ? WHERE id = ?");
            $stmt->execute([
                $input['status'] ?? 'available',
                $input['condition'] ?? 'Baik',
                $id
            ]);
            
            // Get the updated equipment
            $stmt = $pdo->prepare("SELECT * FROM equipment WHERE id = ?");
            $stmt->execute([$id]);
            $equipment = $stmt->fetch();
            
            if (!$equipment) {
                sendError('Equipment tidak ditemukan', 404);
            }
            
            sendResponse($equipment);
            break;
            
        default:
            sendError('Method tidak didukung', 405);
            break;
    }
    
} catch (Exception $e) {
    sendError('Terjadi kesalahan: ' . $e->getMessage(), 500);
}
?>