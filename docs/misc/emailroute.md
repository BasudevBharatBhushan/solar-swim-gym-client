# Email Sending Route

This document details the generalized email sending endpoint in the Solar Swim Gym backend.

## Endpoints Overview

1.  **SMTP Configuration**: `/api/v1/email-config/`
2.  **Templates**: `/api/v1/emails/templates`
3.  **Logs**: `/api/v1/emails/logs`
4.  **Sending**: `/api/v1/emails/send`

---

## 1. SMTP Configuration

Manage the SMTP settings for a specific location.

### **GET** `/api/v1/email-config/`

Fetches the current email configuration for the location.

-   **Headers**: `Authorization`, `x-location-id` (Optional if in token)
-   **Response**:
    ```json
    {
      "success": true,
      "data": {
        "config_id": "uuid",
        "location_id": "uuid",
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "sender_email": "info@example.com",
        "sender_name": "My Business",
        "is_active": true
        // ... (sensitive fields like password might be masked or omitted)
      }
    }
    ```

### **POST** `/api/v1/email-config/`

Creates or updates the email configuration.

-   **Headers**: `Authorization`, `x-location-id` (Optional)
-   **Body**:
    ```json
    {
      "location_id": "uuid", // Optional if in header
      "smtp_host": "smtp.example.com",
      "smtp_port": 587,
      "sender_email": "info@example.com",
      "sender_name": "My Business",
      "smtp_username": "user",
      "smtp_password": "password",
      "is_secure": true,
      "is_active": true
    }
    ```
-   **Response**: Returns the updated configuration.

---

## 2. Email Templates

Manage reusable email templates.

### **GET** `/api/v1/emails/templates`

Fetches all email templates for the location.

-   **Headers**: `Authorization`, `x-location-id`
-   **Response**:
    ```json
    {
      "success": true,
      "data": [
        {
          "email_template_id": "uuid",
          "subject": "Welcome!",
          "body_content": "<h1>Hello...</h1>",
          "created_at": "..."
        }
      ]
    }
    ```

### **POST** `/api/v1/emails/templates`

Creates or updates an email template.

-   **Headers**: `Authorization`, `x-location-id`
-   **Body**:
    ```json
    {
      "email_template_id": "uuid", // Optional (if updating)
      "location_id": "uuid", // Optional if in header
      "subject": "New Template",
      "body_content": "<p>Content</p>"
    }
    ```
-   **Response**: Returns the created/updated template.

---

## 3. Email Logs

Access history of sent emails.

### **POST** `/api/v1/emails/logs`

Manually create an email log entry (mostly for internal use or external systems).

-   **Headers**: `Authorization`, `x-location-id`
-   **Body**: match `EmailLog` structure (sender, receiver, content, etc.)
-   **Response**: Returns the created log entry.

### **GET** `/api/v1/emails/logs/account/:accountId`

Fetches email logs associated with a specific account.

-   **Headers**: `Authorization`, `x-location-id`
-   **Params**: `accountId` (UUID)
-   **Response**:
    ```json
    {
      "success": true,
      "data": [
        {
          "email_log_id": "uuid",
          "subject": "Invoice #123",
          "timestamp": "...",
          "is_email_sent": true
          // ...
        }
      ]
    }
    ```

---

## 4. Sending Email (Generalized Route)

**POST** `/api/v1/emails/send`

## Description

This route allows authorized staff to send emails with support for HTML content and multiple attachments. The system automatically logs all sent emails and uses the location-specific SMTP configuration. It now supports comprehensive logging by accepting context identifiers like `account_id`, `staff_id`, and `email_template_id`.

## Authorization

- **Authentication**: Required (Bearer Token)
- **Role**: `STAFF`, `ADMIN`, `SUPERADMIN`
- **Location Access**: Verified against `location_id`

## Headers

| Header | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | Yes | Bearer token |
| `x-location-id` | `UUID` | No* | Location context. If not provided, it must be in the token or body. |

## Request Body (multipart/form-data)

Since attachments are supported, the request must be `multipart/form-data`.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `to` | `string` | Yes | Recipient email address. |
| `subject` | `string` | Yes | Subject line of the email. |
| `body` | `string` | Yes | Content of the email. Can be HTML or plain text. |
| `isHtml` | `boolean` | No | Set to `true` if `body` contains HTML. Default: `false`. |
| `from` | `string` | No | Sender email. Defaults to SMTP config sender. |
| `fromName` | `string` | No | Sender name. Defaults to SMTP config name. |
| `toName` | `string` | No | Recipient name for logging/personalization. |
| `cc` | `string` | No | CC recipients (comma-separated). |
| `bcc` | `string` | No | BCC recipients (comma-separated). |
| `location_id` | `UUID` | No* | Location context if not in header/token. |
| `attachments` | `File[]` | No | One or more files to attach. |
| `account_id` | `UUID` | No | The ID of the account related to this email (for logging). |
| `staff_id` | `UUID` | No | The ID of the staff member related to this email (for logging, if different from sender). |
| `email_template_id` | `UUID` | No | The ID of the email template used (for logging). |

## Response

### Success (200 OK)

```json
{
  "success": true,
  "message": "Email sent successfully",
  "log_id": "uuid-of-created-log-entry",
  "data": {
    "email_log_id": "uuid",
    "location_id": "uuid",
    "account_id": "uuid",
    "staff_id": "uuid",
    "sender_email": "sender@example.com",
    "sender_name": "Sender Name",
    "cc": null,
    "bcc": null,
    "receiver_email": "recipient@example.com",
    "receiver_name": null,
    "subject": "Email Subject",
    "content": "Email Body",
    "timestamp": "ISO Date",
    "is_email_sent": true,
    "email_template_id": "uuid"
  }
}
```

### Error (400 Bad Request)

```json
{
  "success": false,
  "error": "Recipient email is required"
}
```

### Error (401 Unauthorized / 403 Forbidden)

```json
{
  "success": false,
  "error": "Access denied to this location"
}
```

### Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to send email: [Error Details]"
}
```

## Logging

Every attempt to send an email via this route creates a record in the `email_log` table with:
- Sender/Receiver details
- Subject and Content
- Timestamp
- Status (`is_email_sent`)
- Context IDs: `account_id`, `staff_id`, `email_template_id`
- Attachments are processed but file content is not stored in the log.
