<?php
header('Content-Type: application/json');
require_once 'includes/config.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Validate and sanitize input data
function sanitize_input($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Validate phone number
function validate_phone($phone) {
    return preg_match('/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/', $phone);
}

// Send email using PHPMailer and Hostinger's SMTP
function sendEmail($to, $subject, $body, $from, $fromName) {
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;
        
        // Recipients
        $mail->setFrom($from, $fromName);
        $mail->addAddress($to);
        $mail->addReplyTo($from, $fromName);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = nl2br($body);
        $mail->AltBody = strip_tags($body);
        
        return $mail->send();
    } catch (Exception $e) {
        error_log("Mail Error: {$mail->ErrorInfo}");
        return false;
    }
}

// Check if the form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $response = ['success' => false, 'message' => ''];
    
    try {
        // Get and sanitize form data
        $firstname = sanitize_input($_POST['firstname'] ?? '');
        $lastname = sanitize_input($_POST['lastname'] ?? '');
        $email = sanitize_input($_POST['email'] ?? '');
        $phone = sanitize_input($_POST['phone'] ?? '');
        $source = sanitize_input($_POST['source'] ?? '');
        $message = sanitize_input($_POST['message'] ?? '');

        // Validation
        $errors = [];
        
        if (empty($firstname)) $errors[] = 'First name is required';
        if (empty($lastname)) $errors[] = 'Last name is required';
        if (empty($email)) $errors[] = 'Email is required';
        if (empty($message)) $errors[] = 'Message is required';
        
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Invalid email format';
        }
        
        if (!empty($phone) && !validate_phone($phone)) {
            $errors[] = 'Invalid phone number format';
        }

        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors));
        }

        // Get database connection
        $db = getDbConnection();
        if (!$db) {
            throw new Exception('Database connection failed');
        }

        // Store in database
        $stmt = $db->prepare("
            INSERT INTO inquiries (first_name, last_name, email, phone, source, message)
            VALUES (:firstname, :lastname, :email, :phone, :source, :message)
        ");

        $stmt->execute([
            ':firstname' => $firstname,
            ':lastname' => $lastname,
            ':email' => $email,
            ':phone' => $phone,
            ':source' => $source,
            ':message' => $message
        ]);

        // Prepare email content
        $subject = "New Contact Form Submission from $firstname $lastname";
        $email_content = "
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> $firstname $lastname</p>
            <p><strong>Email:</strong> $email</p>
            <p><strong>Phone:</strong> $phone</p>
            <p><strong>Source:</strong> $source</p>
            <p><strong>Message:</strong><br>$message</p>
        ";

        // Send email using PHPMailer
        if (sendEmail(ADMIN_EMAIL, $subject, $email_content, $email, "$firstname $lastname")) {
            $response = [
                'success' => true,
                'message' => 'Thank you for your message. We will get back to you soon!'
            ];
        } else {
            // Even if email fails, data is stored in DB
            $response = [
                'success' => true,
                'message' => 'Thank you for your message. We will get back to you soon! (Email notification delayed)'
            ];
            error_log("Email sending failed for inquiry from: $email");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        error_log("Form submission error: " . $e->getMessage());
    }

    echo json_encode($response);
} else {
    // Not a POST request
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>