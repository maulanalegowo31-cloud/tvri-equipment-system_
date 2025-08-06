<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

try {
    // Get total equipment count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM equipment");
    $stmt->execute();
    $totalEquipment = $stmt->fetch()['total'];
    
    // Get available equipment count
    $stmt = $pdo->prepare("SELECT COUNT(*) as available FROM equipment WHERE status = 'available'");
    $stmt->execute();
    $availableEquipment = $stmt->fetch()['available'];
    
    // Get borrowed equipment count (active borrowings)
    $stmt = $pdo->prepare("SELECT COUNT(*) as borrowed FROM borrowings WHERE status = 'active'");
    $stmt->execute();
    $borrowedEquipment = $stmt->fetch()['borrowed'];
    
    // Get damaged equipment count
    $stmt = $pdo->prepare("SELECT COUNT(*) as damaged FROM equipment WHERE `condition` = 'Rusak'");
    $stmt->execute();
    $damagedEquipment = $stmt->fetch()['damaged'];
    
    $statistics = [
        'totalEquipment' => (int)$totalEquipment,
        'availableEquipment' => (int)$availableEquipment,
        'borrowedEquipment' => (int)$borrowedEquipment,
        'damagedEquipment' => (int)$damagedEquipment,
        'lastUpdate' => date('c') // ISO 8601 format
    ];
    
    sendResponse($statistics);
    
} catch (Exception $e) {
    sendError('Terjadi kesalahan: ' . $e->getMessage(), 500);
}
?>