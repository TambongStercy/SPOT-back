# SPOTT Backend

A Node.js backend application for the SPOTT platform, a location-based service that allows users to discover and interact with spots and events.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Location and Device Management](#location-and-device-management)
  - [Spots and Events](#spots-and-events)
- [Models](#models)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)

## Overview

SPOTT is a location-based platform that connects users with interesting spots and events around them. The backend provides APIs for user management, location tracking, spot and event discovery, and user activity monitoring.

## Project Structure

```
SPOTT backend/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── helpers/            # Utility functions
├── middleware/         # Express middleware
├── models/             # Mongoose models
├── routes/             # API routes
├── services/           # Business logic
├── uploads/            # Temporary file storage
├── app.js              # Application entry point
├── package.json        # Dependencies and scripts
└── README.md           # Project documentation
```

## Setup and Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/spott-backend.git
cd spott-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spott
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
REDIS_URL=redis://localhost:6379
```

4. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication

#### Register a new user

```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "password": "securepassword",
  "dateOfBirth": "1990-01-01",
  "sex": "Male",
  "fcmToken": "firebase-cloud-messaging-token",
  "deviceInfo": "iPhone 13 Pro"
}
```

#### Login

```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword",
  "fcmToken": "firebase-cloud-messaging-token",
  "deviceInfo": "iPhone 13 Pro"
}
```

#### Logout

```
POST /api/v1/auth/logout
```

**Request Body:**
```json
{
  "fcmToken": "firebase-cloud-messaging-token"
}
```

#### Logout from all devices

```
POST /api/v1/auth/logout-all
```

### User Management

#### Request OTP

```
POST /api/v1/user/request-otp
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "reason": "verify-email"
}
```

#### Reset Password

```
POST /api/v1/user/reset-password
```

**Request Body:**
```json
{
  "otp": "123456",
  "newPassword": "newsecurepassword"
}
```

#### Verify Email

```
POST /api/v1/user/verify-email
```

**Request Body:**
```json
{
  "otp": "123456"
}
```

#### Modify User Information

```
PUT /api/v1/user/modify-info
```

**Request Body:**
```json
{
  "name": "John Smith",
  "dateOfBirth": "1990-01-01",
  "sex": "Male"
}
```

#### Modify Email

```
PUT /api/v1/user/modify-email
```

**Request Body:**
```json
{
  "email": "newjohn@example.com",
  "otp": "123456"
}
```

#### Upload Avatar

```
POST /api/v1/user/avatar
```

**Request Body:**
Form data with key `avatar` containing the image file.

### Location and Device Management

#### Update User Location

Updates the user's location and stores it in the location history.

```
PUT /api/v1/user/location
```

**Request Body:**
```json
{
  "lon": 12.34567,
  "lat": 45.67890,
  "fcmToken": "firebase-cloud-messaging-token"
}
```

**Response:**
```json
{
  "msg": "Location updated successfully",
  "location": {
    "_id": "60f8a1b3c1d2e3f4a5b6c7d8",
    "userDevice": "60f8a1b3c1d2e3f4a5b6c7d9",
    "location": {
      "type": "Point",
      "coordinates": [12.34567, 45.67890]
    },
    "createdAt": "2023-07-15T10:30:00.000Z",
    "updatedAt": "2023-07-15T10:30:00.000Z"
  },
  "userLocation": {
    "type": "Point",
    "coordinates": [12.34567, 45.67890]
  }
}
```

#### Update Current Location (without history)

Updates only the user's current location without storing it in the history.

```
POST /api/v1/user/location/current
```

**Request Body:**
```json
{
  "lon": 12.34567,
  "lat": 45.67890,
  "fcmToken": "firebase-cloud-messaging-token"
}
```

#### Get Location History

Retrieves the location history for the authenticated user.

```
GET /api/v1/user/location-history
```

**Query Parameters:**
- `startDate` (optional): Filter locations from this date (ISO format)
- `endDate` (optional): Filter locations until this date (ISO format)
- `limit` (optional): Maximum number of records to return (default: 100)
- `fcmToken` (optional): Filter by specific device FCM token

**Response:**
```json
{
  "msg": "Location history retrieved successfully",
  "history": [
    {
      "_id": "60f8a1b3c1d2e3f4a5b6c7d8",
      "userDevice": {
        "_id": "60f8a1b3c1d2e3f4a5b6c7d9",
        "deviceInfo": "iPhone 13 Pro",
        "fcmToken": "fcm-token-example-123"
      },
      "location": {
        "type": "Point",
        "coordinates": [12.34567, 45.67890]
      },
      "createdAt": "2023-07-15T10:30:00.000Z",
      "updatedAt": "2023-07-15T10:30:00.000Z"
    },
    // Additional location history entries...
  ]
}
```

#### Get User Devices Latest Locations

Retrieves the latest location for each device associated with the authenticated user.

```
GET /api/v1/user/devices/locations
```

**Response:**
```json
{
  "msg": "User devices latest locations retrieved successfully",
  "devices": [
    {
      "device": {
        "info": "Samsung Galaxy S21",
        "fcmToken": "fcm-token-example-456"
      },
      "location": {
        "_id": "60f8a1b3c1d2e3f4a5b6c7d8",
        "userDevice": "60f8a1b3c1d2e3f4a5b6c7d9",
        "location": {
          "type": "Point",
          "coordinates": [12.34567, 45.67890]
        },
        "createdAt": "2023-07-15T10:30:00.000Z",
        "updatedAt": "2023-07-15T10:30:00.000Z"
      }
    },
    // Additional devices with their latest locations...
  ]
}
```

#### Logout Device

Logs out a specific device by deactivating it in the system.

```
POST /api/v1/user/devices/logout
```

**Request Body:**
```json
{
  "fcmToken": "fcm-token-to-logout"
}
```

**Response:**
```json
{
  "msg": "Device logged out successfully"
}
```

### Spots and Events

#### Get Nearby Spots

```
GET /api/v1/spots/nearby
```

**Query Parameters:**
- `lon`: Longitude of the center point
- `lat`: Latitude of the center point
- `radius` (optional): Search radius in meters (default: 5000)
- `categories` (optional): Comma-separated list of categories
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page

#### Get Spot Details

```
GET /api/v1/spots/:id
```

#### Get Upcoming Events

```
GET /api/v1/events/upcoming
```

**Query Parameters:**
- `lon` (optional): Longitude for proximity sorting
- `lat` (optional): Latitude for proximity sorting
- `startDate` (optional): Filter events starting from this date
- `endDate` (optional): Filter events ending before this date
- `categories` (optional): Comma-separated list of categories
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page

#### Get Event Details

```
GET /api/v1/events/:id
```

## Models

### User

- `name`: User's full name
- `phone`: Phone number (unique)
- `phoneVerified`: Boolean indicating if phone is verified
- `email`: Email address (unique, optional)
- `verifiedEmail`: Boolean indicating if email is verified
- `password`: Hashed password
- `dateOfBirth`: Date of birth
- `sex`: Gender (Male/Female)
- `avatar`: URL to user's profile picture
- `fcmtoken`: Firebase Cloud Messaging token
- `token`: Authentication token

### UserDevice

- `user`: Reference to User model
- `fcmToken`: Firebase Cloud Messaging token (unique)
- `deviceInfo`: Information about the device
- `lastUsed`: Date when the device was last used
- `isActive`: Boolean indicating if the device is active

### CurrentLocation

- `userDevice`: Reference to UserDevice model
- `location`: GeoJSON Point with coordinates [longitude, latitude]

### LocationHistory

- `userDevice`: Reference to UserDevice model
- `location`: GeoJSON Point with coordinates [longitude, latitude]

### Spot

- `name`: Name of the spot
- `description`: Detailed description
- `location`: GeoJSON Point with coordinates
- `address`: Physical address
- `category`: Category of the spot
- `photos`: Array of photo URLs
- `rating`: Average rating
- `openingHours`: Operating hours
- `contactInfo`: Contact information
- `owner`: Reference to User model

### Event

- `title`: Event title
- `description`: Detailed description
- `location`: GeoJSON Point with coordinates
- `address`: Physical address
- `startDate`: Event start date and time
- `endDate`: Event end date and time
- `category`: Category of the event
- `photos`: Array of photo URLs
- `organizer`: Reference to User model
- `spot`: Reference to Spot model (optional)

## Technologies Used

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Multer**: File uploads
- **Cloudinary**: Cloud storage for images
- **Nodemailer**: Email sending
- **Redis**: Caching and rate limiting
- **Joi**: Request validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 