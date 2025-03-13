# Session and Activity History API Documentation

## Session Location History Endpoints

### Get User Session History
Retrieves the session location history for the authenticated user.

```http
GET /api/users/session-history
```

#### Query Parameters
- `startDate` (optional): ISO date string to filter sessions from this date
- `endDate` (optional): ISO date string to filter sessions until this date
- `limit` (optional): Number of records to return (default: 100)
- `eventType` (optional): Type of session event to filter by

#### Response
```json
{
  "sessionHistory": [
    {
      "location": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "eventType": "string",
      "createdAt": "timestamp",
      "deviceInfo": {
        "model": "string",
        "platform": "string"
      }
    }
  ]
}
```

### Get Device Session History
Retrieves the session history for a specific device.

```http
GET /api/users/devices/:deviceId/session-history
```

#### Path Parameters
- `deviceId`: ID of the device to get history for

#### Query Parameters
- `startDate` (optional): ISO date string to filter sessions from this date
- `endDate` (optional): ISO date string to filter sessions until this date
- `limit` (optional): Number of records to return (default: 100)
- `eventType` (optional): Type of session event to filter by

#### Response
```json
{
  "sessionHistory": [
    {
      "location": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "eventType": "string",
      "createdAt": "timestamp",
      "deviceInfo": {
        "model": "string",
        "platform": "string"
      }
    }
  ]
}
```

## Recently Opened Items Endpoints

### Get Recently Opened Items
Retrieves the user's recently opened spots and events.

```http
GET /api/users/recently-opened
```

#### Query Parameters
- `itemType` (optional): Type of items to retrieve ("spot" or "event")
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20)

#### Response
```json
{
  "success": true,
  "items": [
    {
      "itemId": "string",
      "itemType": "string",
      "lastOpenedAt": "timestamp",
      "itemDetails": {
        // Spot or Event details
      }
    }
  ],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalItems": number,
    "hasMore": boolean
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message description",
  "error": "Detailed error information"
}
```

## Notes

- All endpoints require authentication
- Dates should be provided in ISO 8601 format
- The session history is ordered by most recent first
- Recently opened items are tracked automatically when users view spots or events
- Session events may include: "login", "logout", "background", "foreground"