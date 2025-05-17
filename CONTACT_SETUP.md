# Contact Form Setup

This document provides instructions for setting up the contact form to work with Hostinger's SMTP server.

## Prerequisites

- PHP 7.4 or higher
- Composer (for dependency installation)
- Hostinger hosting account

## Installation Steps

1. **Install dependencies using Composer**

   ```bash
   # Navigate to your project directory
   cd /path/to/website/root

   # Install PHPMailer and other dependencies
   composer install
   ```

2. **Set up environment variables**

   Update the `.env` file with your actual SMTP credentials:

   ```
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=info@resonancedesignstudio.com
   SMTP_PASS=your_actual_password
   ```

3. **Database setup (Optional if you're using the database functionality)**

   Run the database schema file:

   ```bash
   # If using MySQL/MariaDB
   mysql -u username -p database_name < db/schema.sql
   ```

## Testing

1. Fill out the contact form on the website
2. Check that the form submits successfully
3. Verify that you receive the email at your configured address

## Troubleshooting

- If emails are not sending, check the server error logs
- Make sure outgoing port 465 is not blocked by your hosting provider
- Verify your SMTP credentials are correct

## Security Notes

- The `.env` file contains sensitive information and should not be committed to version control
- Make sure your server is configured to deny web access to the `.env` file
