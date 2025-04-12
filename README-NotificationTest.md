# Notification Testing API

This document provides information on how to use the notification testing endpoints in the SPOTT backend.

## Overview

The notification testing API allows you to test various notification functionalities without having to trigger the actual business logic that would normally send these notifications. This is useful for testing notification delivery, formatting, and handling on client devices.

## Base URL

All test endpoints are available under:

```
/api/v1/test
```

## Endpoints

### 1. Check Notification Service Status

Checks if the notification services are properly configured and available.

**Endpoint:** `GET /api/v1/test/notifications/status`

**Response:**
```json
{
  "success": true,
  "status": {
    "firebaseInitialized": true,
    "notificationServiceAvailable": true,
    "notificationServicesAvailable": true
  }
}
```

### 2. Test User Notification

Sends a test notification to a specific user.

**Endpoint:** `POST /api/v1/test/notifications/user`

**Request Body:**
```json
{
  "userId": "60f8a5b3e6b3f32d8c9e4b7a",
  "title": "Test Notification",
  "body": "This is a test notification",
  "data": {
    "type": "test",
    "additionalInfo": "Any additional data can go here"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification test executed",
  "result": {
    "success": true,
    "successCount": 1,
    "failureCount": 0,
    "responses": [
      { "success": true, "messageId": "projects/..." }
    ]
  }
}
```

### 3. Test Chat Notification

Sends a test chat notification to a user.

**Endpoint:** `POST /api/v1/test/notifications/chat`

**Request Body:**
```json
{
  "userId": "60f8a5b3e6b3f32d8c9e4b7a",
  "senderId": "60f8a5b3e6b3f32d8c9e4b7b",
  "chatId": "chat123",
  "content": "Hello, this is a test chat message!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat notification test executed",
  "result": {
    "success": true,
    "successCount": 1,
    "failureCount": 0,
    "responses": [
      { "success": true, "messageId": "projects/..." }
    ]
  }
}
```

### 4. Test Admin Notification

Sends a test notification to all admin users.

**Endpoint:** `POST /api/v1/test/notifications/admin`

**Request Body:**
```json
{
  "title": "Admin Test Notification",
  "body": "This is a test notification for admins",
  "data": {
    "type": "admin_test",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin notification test executed",
  "result": {
    "success": true,
    "successCount": 2,
    "failureCount": 0,
    "responses": [
      { "success": true, "messageId": "projects/..." },
      { "success": true, "messageId": "projects/..." }
    ]
  }
}
```

### 5. Test New Chat Notification

Sends a test notification to admins about a new chat.

**Endpoint:** `POST /api/v1/test/notifications/new-chat`

**Request Body:**
```json
{
  "userId": "60f8a5b3e6b3f32d8c9e4b7a",
  "chatId": "chat123",
  "subject": "Help with account"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New chat notification test executed",
  "result": {
    "success": true,
    "successCount": 2,
    "failureCount": 0,
    "responses": [
      { "success": true, "messageId": "projects/..." },
      { "success": true, "messageId": "projects/..." }
    ]
  }
}
```

### 6. Test Collapsible Notification

Sends a test collapsible notification to a specific device.

**Endpoint:** `POST /api/v1/test/notifications/collapsible`

**Request Body:**
```json
{
  "deviceToken": "fcm-token-example",
  "collapseKey": "updates",
  "title": "Collapsible Notification",
  "body": "This notification will replace previous ones with the same collapse key",
  "data": {
    "type": "update",
    "id": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collapsible notification test executed"
}
```

### 7. Test Non-Collapsible Notification

Sends a test non-collapsible notification to a specific device.

**Endpoint:** `POST /api/v1/test/notifications/non-collapsible`

**Request Body:**
```json
{
  "deviceToken": "fcm-token-example",
  "title": "Non-Collapsible Notification",
  "body": "This is a standard notification",
  "data": {
    "type": "alert",
    "id": "456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Non-collapsible notification test executed"
}
```

## Testing with Postman

1. Set up a Postman collection for your API
2. Add a request for each notification type
3. Configure the request body according to the examples above
4. Send the request and check the response
5. Verify that the notification is received on the target device(s)

## Testing with cURL

Example cURL command for testing user notification:

```bash
curl -X POST \
  http://localhost:5008/api/v1/test/notifications/user \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "60f8a5b3e6b3f32d8c9e4b7a",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {
      "type": "test"
    }
  }'
```

## Troubleshooting

If notifications are not being received:

1. Check the response from the test endpoint for any errors
2. Verify that the Firebase configuration is correct
3. Ensure the FCM tokens are valid and up-to-date
4. Check that the target devices have proper permissions for notifications
5. Verify network connectivity between the server and Firebase Cloud Messaging
6. Check the Firebase console for any delivery issues

## Security Considerations

- These endpoints are publicly accessible for testing purposes
- In production environments, consider:
  - Restricting access to these routes to specific IPs
  - Disabling these routes entirely
  - Adding a simple API key mechanism for basic protection
- Never expose FCM tokens or device IDs in client-side code or logs 