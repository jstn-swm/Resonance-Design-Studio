<?php
// Load environment variables
function loadEnv() {
    // First try to load from Hostinger's environment
    $db_host = getenv('MYSQL_HOSTNAME') ?: getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('MYSQL_DATABASE') ?: getenv('DB_NAME') ?: 'u123456789_resonance'; // Replace with your Hostinger DB name
    $db_user = getenv('MYSQL_USERNAME') ?: getenv('DB_USER') ?: 'u123456789_user'; // Replace with your Hostinger DB user
    $db_pass = getenv('MYSQL_PASSWORD') ?: getenv('DB_PASS') ?: '';
    
    // If we're in local development, try to load from .env file
    if ($db_host === 'localhost') {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                    list($key, $value) = explode('=', $line, 2);
                    $_ENV[trim($key)] = trim($value);
                    putenv(trim($key) . '=' . trim($value));
                }
            }
            // Recheck environment variables after loading .env
            $db_host = getenv('DB_HOST') ?: 'localhost';
            $db_name = getenv('DB_NAME') ?: 'resonance_studio';
            $db_user = getenv('DB_USER');
            $db_pass = getenv('DB_PASS');
        }
    }
    
    // Define constants
    define('DB_HOST', $db_host);
    define('DB_NAME', $db_name);
    define('DB_USER', $db_user);
    define('DB_PASS', $db_pass);
}

loadEnv();

// Email configuration - use Hostinger's SMTP if available
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.hostinger.com');
define('SMTP_PORT', getenv('SMTP_PORT') ?: '587');
define('SMTP_USER', getenv('SMTP_USER') ?: DB_USER);
define('SMTP_PASS', getenv('SMTP_PASS') ?: DB_PASS);
define('ADMIN_EMAIL', getenv('ADMIN_EMAIL') ?: 'your@email.com');

// Security configuration with fallback
define('ENCRYPTION_KEY', getenv('ENCRYPTION_KEY') ?: hash('sha256', DB_PASS));

// Create database connection with improved error handling for Hostinger
function getDbConnection() {
    try {
        $retries = 3;
        $lastError = null;
        
        while ($retries > 0) {
            try {
                $conn = new PDO(
                    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::ATTR_PERSISTENT => true, // Use persistent connections
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                    ]
                );
                
                // Set session SQL mode for Hostinger compatibility
                $conn->exec("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");
                
                return $conn;
            } catch (PDOException $e) {
                $lastError = $e;
                $retries--;
                if ($retries > 0) {
                    sleep(1); // Wait before retrying
                }
            }
        }
        
        // Log the error and return false if all retries failed
        error_log("Database connection failed after 3 attempts: " . $lastError->getMessage());
        return false;
        
    } catch (Exception $e) {
        error_log("Unexpected error in database connection: " . $e->getMessage());
        return false;
    }
}

// Security helper functions optimized for Hostinger
function generateCSRFToken() {
    if (empty($_SESSION['csrf_token']) || 
        (isset($_SESSION['csrf_token_time']) && time() - $_SESSION['csrf_token_time'] > 3600)) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    return $_SESSION['csrf_token'];
}

function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && 
           hash_equals($_SESSION['csrf_token'], $token) && 
           isset($_SESSION['csrf_token_time']) && 
           (time() - $_SESSION['csrf_token_time'] <= 3600);
}

// Enhanced encryption functions with error handling
function encrypt($data) {
    try {
        $key = base64_decode(ENCRYPTION_KEY);
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        if ($encrypted === false) {
            throw new Exception('Encryption failed');
        }
        return base64_encode($iv . $encrypted);
    } catch (Exception $e) {
        error_log("Encryption error: " . $e->getMessage());
        return false;
    }
}

function decrypt($data) {
    try {
        $key = base64_decode(ENCRYPTION_KEY);
        $data = base64_decode($data);
        if ($data === false) {
            throw new Exception('Invalid base64 encoding');
        }
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
        if ($decrypted === false) {
            throw new Exception('Decryption failed');
        }
        return $decrypted;
    } catch (Exception $e) {
        error_log("Decryption error: " . $e->getMessage());
        return false;
    }
}

// Initialize session with secure settings for Hostinger
function initSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_samesite', 'Strict');
        session_start();
    }
}

// Call session initialization
initSession();