```php
<?php
// Production-ready database config

// Load environment variables (jika menggunakan hosting yang support .env)
$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? 'tvri_equipment';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '123456';

// Fallback untuk development
if (file_exists('../.env')) {
    $env = parse_ini_file('../.env');
    $host = $env['DB_HOST'] ?? $host;
    $dbname = $env['DB_NAME'] ?? $dbname;
    $username = $env['DB_USER'] ?? $username;
    $password = $env['DB_PASS'] ?? $password;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    // Log error untuk production
    error_log("Database connection failed: " . $e->getMessage());
    die("Koneksi database gagal. Silakan hubungi administrator.");
}

// Helper functions (sama seperti sebelumnya)
function sendResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError($message, $status = 400) {
    sendResponse(['error' => $message], $status);
}

function sendSuccess($data = null, $message = 'Success') {
    $response = ['message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendResponse($response);
}

date_default_timezone_set('Asia/Jakarta');
?>
```