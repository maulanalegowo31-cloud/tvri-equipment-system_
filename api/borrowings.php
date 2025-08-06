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
$segments = explode('/', trim($path, '/'));

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['active'])) {
                // Get active borrowings with equipment details
                $stmt = $pdo->prepare("
                    SELECT b.*, e.name as equipment_name, e.serial_number as equipment_serial, e.type as equipment_type
                    FROM borrowings b
                    JOIN equipment e ON b.equipment_id = e.id
                    WHERE b.status = 'active'
                    ORDER BY b.pickup_date, b.pickup_time
                ");
                $stmt->execute();
                $borrowings = $stmt->fetchAll();
                
                // Add equipment object for compatibility
                foreach ($borrowings as &$borrowing) {
                    $borrowing['equipment'] = [
                        'name' => $borrowing['equipment_name'],
                        'serialNumber' => $borrowing['equipment_serial'],
                        'type' => $borrowing['equipment_type']
                    ];
                }
                
                sendResponse($borrowings);
            } else {
                // Get all borrowings
                $stmt = $pdo->prepare("
                    SELECT b.*, e.name as equipment_name, e.serial_number as equipment_serial, e.type as equipment_type
                    FROM borrowings b
                    JOIN equipment e ON b.equipment_id = e.id
                    ORDER BY b.created_at DESC
                ");
                $stmt->execute();
                $borrowings = $stmt->fetchAll();
                
                // Add equipment object for compatibility
                foreach ($borrowings as &$borrowing) {
                    $borrowing['equipment'] = [
                        'name' => $borrowing['equipment_name'],
                        'serialNumber' => $borrowing['equipment_serial'],
                        'type' => $borrowing['equipment_type']
                    ];
                }
                
                sendResponse($borrowings);
            }
            break;
            
        case 'POST':
            if (end($segments) === 'return' && isset($segments[count($segments) - 2])) {
                // Return borrowing
                $borrowingId = $segments[count($segments) - 2];
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    sendError('Data tidak valid');
                }
                
                // Get borrowing details
                $stmt = $pdo->prepare("SELECT * FROM borrowings WHERE id = ? AND status = 'active'");
                $stmt->execute([$borrowingId]);
                $borrowing = $stmt->fetch();
                
                if (!$borrowing) {
                    sendError('Peminjaman tidak ditemukan atau sudah dikembalikan', 404);
                }
                
                // Update borrowing status
                $stmt = $pdo->prepare("UPDATE borrowings SET 
                    actual_return_date = ?, 
                    actual_return_time = ?, 
                    return_condition = ?, 
                    return_notes = ?, 
                    status = 'returned' 
                    WHERE id = ?");
                $stmt->execute([
                    $input['actualReturnDate'],
                    $input['actualReturnTime'],
                    $input['returnCondition'],
                    $input['returnNotes'] ?? '',
                    $borrowingId
                ]);
                
                // Update equipment status and condition
                $stmt = $pdo->prepare("UPDATE equipment SET status = 'available', `condition` = ? WHERE id = ?");
                $stmt->execute([$input['returnCondition'], $borrowing['equipment_id']]);
                
                // Get updated borrowing
                $stmt = $pdo->prepare("SELECT * FROM borrowings WHERE id = ?");
                $stmt->execute([$borrowingId]);
                $updatedBorrowing = $stmt->fetch();
                
                sendResponse($updatedBorrowing);
                
            } else {
                // Create new borrowing
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    sendError('Data tidak valid');
                }
                
                // Check for time conflicts
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count FROM borrowings 
                    WHERE equipment_id = ? 
                    AND status = 'active'
                    AND (
                        (pickup_date = ? AND pickup_time <= ? AND expected_return_time >= ?) OR
                        (expected_return_date = ? AND pickup_time <= ? AND expected_return_time >= ?) OR
                        (pickup_date < ? AND expected_return_date > ?) OR
                        (pickup_date = ? AND expected_return_date = ? AND pickup_time <= ? AND expected_return_time >= ?)
                    )
                ");
                $stmt->execute([
                    $input['equipmentId'],
                    $input['pickupDate'], $input['expectedReturnTime'], $input['pickupTime'],
                    $input['expectedReturnDate'], $input['expectedReturnTime'], $input['pickupTime'],
                    $input['pickupDate'], $input['expectedReturnDate'],
                    $input['pickupDate'], $input['expectedReturnDate'], $input['expectedReturnTime'], $input['pickupTime']
                ]);
                
                if ($stmt->fetch()['count'] > 0) {
                    sendError('Alat sudah dipinjam pada waktu yang dipilih. Silakan pilih waktu lain.');
                }
                
                // Verify equipment is available
                $stmt = $pdo->prepare("SELECT * FROM equipment WHERE id = ?");
                $stmt->execute([$input['equipmentId']]);
                $equipment = $stmt->fetch();
                
                if (!$equipment) {
                    sendError('Alat tidak ditemukan', 404);
                }
                
                if ($equipment['status'] !== 'available' || $equipment['condition'] === 'Rusak') {
                    sendError('Alat tidak tersedia untuk dipinjam');
                }
                
                // Create borrowing
                $id = bin2hex(random_bytes(16));
                $stmt = $pdo->prepare("INSERT INTO borrowings (
                    id, borrower_name, borrower_email, equipment_id, event_name,
                    pickup_date, pickup_time, expected_return_date, expected_return_time,
                    borrow_condition, notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
                
                $stmt->execute([
                    $id,
                    $input['borrowerName'],
                    $input['borrowerEmail'] ?? null,
                    $input['equipmentId'],
                    $input['eventName'],
                    $input['pickupDate'],
                    $input['pickupTime'],
                    $input['expectedReturnDate'],
                    $input['expectedReturnTime'],
                    $input['borrowCondition'],
                    $input['notes'] ?? ''
                ]);
                
                // Update equipment status
                $stmt = $pdo->prepare("UPDATE equipment SET status = 'borrowed' WHERE id = ?");
                $stmt->execute([$input['equipmentId']]);
                
                // Get created borrowing
                $stmt = $pdo->prepare("SELECT * FROM borrowings WHERE id = ?");
                $stmt->execute([$id]);
                $borrowing = $stmt->fetch();
                
                sendResponse($borrowing, 201);
            }
            break;
            
        default:
            sendError('Method tidak didukung', 405);
            break;
    }
    
} catch (Exception $e) {
    sendError('Terjadi kesalahan: ' . $e->getMessage(), 500);
}
?>