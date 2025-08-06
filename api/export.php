<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

/**
 * Fungsi baru untuk mengubah array PHP menjadi file download CSV.
 * @param string $filename Nama file yang akan di-download.
 * @param array $headers Judul kolom untuk CSV.
 * @param array $data Data (array of arrays/objects) yang akan diekspor.
 */
function exportToCsv($filename, $headers, $data) {
    // Atur header HTTP untuk memaksa browser men-download file
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    // Buka output stream PHP
    $output = fopen('php://output', 'w');
    
    // Tulis baris header (judul kolom)
    fputcsv($output, $headers);
    
    // Tulis setiap baris data ke file
    foreach ($data as $row) {
        // Mengubah objek atau array asosiatif menjadi array biasa sebelum ditulis
        fputcsv($output, (array)$row);
    }
    
    // Tutup output stream
    fclose($output);
    
    // Hentikan eksekusi skrip
    exit();
}

// ... (sisa kode Anda dimulai dari try { ... ) ...

try {
    $type = $_GET['type'] ?? 'borrowings';
    $filter = $_GET['filter'] ?? 'all';
    
    if ($type === 'borrowings') {
        $query = "
            SELECT 
                b.id,
                b.borrower_name,
                b.borrower_email,
                b.event_name,
                b.pickup_date,
                b.pickup_time,
                b.expected_return_date,
                b.expected_return_time,
                b.actual_return_date,
                b.actual_return_time,
                b.borrow_condition,
                b.return_condition,
                b.notes,
                b.return_notes,
                b.status,
                b.created_at,
                e.name as equipment_name,
                e.serial_number as equipment_serial,
                e.type as equipment_type
            FROM borrowings b
            JOIN equipment e ON b.equipment_id = e.id
        ";
        
        if ($filter === 'active') {
            $query .= " WHERE b.status = 'active'";
        } elseif ($filter === 'returned') {
            $query .= " WHERE b.status = 'returned'";
        }
        
        $query .= " ORDER BY b.created_at DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $data = $stmt->fetchAll();
        
        // Add equipment details for compatibility
        foreach ($data as &$row) {
            $row['equipmentName'] = $row['equipment_name'];
            $row['equipmentSerialNumber'] = $row['equipment_serial'];
            $row['equipmentType'] = $row['equipment_type'];
        }
        
    } elseif ($type === 'equipment') {
        $stmt = $pdo->prepare("SELECT * FROM equipment ORDER BY type, name");
        $stmt->execute();
        $data = $stmt->fetchAll();
        
    } elseif ($type === 'summary') {
        // Get summary statistics
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_equipment,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_equipment,
                SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) as borrowed_equipment,
                SUM(CASE WHEN `condition` = 'Rusak' THEN 1 ELSE 0 END) as damaged_equipment
            FROM equipment
        ");
        $stmt->execute();
        $equipmentStats = $stmt->fetch();
        
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_borrowings,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_borrowings,
                SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_borrowings
            FROM borrowings
        ");
        $stmt->execute();
        $borrowingStats = $stmt->fetch();
        
        $data = [
            'equipment_statistics' => $equipmentStats,
            'borrowing_statistics' => $borrowingStats,
            'generated_at' => date('Y-m-d H:i:s')
        ];
        
    } else {
        sendError('Tipe export tidak didukung');
    }
    
// HAPUS BARIS INI:
    // sendResponse($data);
    
    // GANTI DENGAN KODE DI BAWAH INI:

    if (empty($data)) {
        // Handle jika tidak ada data
        // Anda bisa membuat fungsi sendError atau cukup echo pesan
        http_response_code(404);
        echo "Tidak ada data untuk diekspor.";
        exit();
    }
    
    // Ambil judul kolom secara otomatis dari kunci baris pertama data
    $headers = array_keys((array)$data[0]);
    
    // Tentukan nama file secara dinamis
    $filename = "export_" . $type . "_" . date('Y-m-d') . ".csv";
    
    // Panggil fungsi baru yang sudah kita buat di atas untuk men-download file CSV
    exportToCsv($filename, $headers, $data);

// ... (ini adalah akhir dari blok try { ... } Anda) ...
    
} catch (Exception $e) {
    sendError('Terjadi kesalahan: ' . $e->getMessage(), 500);
}
?>