# SPOTT App - Firebase Notifications Guide

This document provides comprehensive instructions for sending notifications to the SPOTT app from a Firebase Admin backend.

## Table of Contents

1. [Firebase Admin SDK Setup](#firebase-admin-sdk-setup)
2. [Notification Structure](#notification-structure)
3. [Sending Notifications](#sending-notifications)
   - [To a Specific Device](#to-a-specific-device)
   - [To Multiple Devices](#to-multiple-devices)
   - [To a Topic](#to-a-topic)
4. [Notification Categories](#notification-categories)
5. [Deep Linking](#deep-linking)
6. [User Preferences](#user-preferences)
7. [Handling Notification Images](#handling-notification-images)
8. [Testing Notifications](#testing-notifications)
9. [Handling Notification Analytics](#handling-notification-analytics)
10. [Troubleshooting](#troubleshooting)

## Firebase Admin SDK Setup

First, set up the Firebase Admin SDK in your backend:

```javascript
const admin = require('firebase-admin');

// Initialize with your service account
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'spot-ad5a2',
    clientEmail: 'firebase-adminsdk@spot-ad5a2.iam.gserviceaccount.com',
    privateKey: 'YOUR_PRIVATE_KEY'
  }),
  databaseURL: 'https://spot-ad5a2.firebaseio.com'
});
```

For security, it's recommended to store your credentials in environment variables:

```javascript
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
```

## Notification Structure

The SPOTT app expects notifications with specific fields:

- **title**: The notification title
- **body**: The notification content
- **data**: A map containing additional information, including:
  - **category**: One of the predefined categories ('app_updates', 'bill_reminder', etc.)
  - Any other payload data needed for deep linking or action handling

Example notification structure:

```javascript
{
  notification: {
    title: "New Spot Near You!",
    body: "Check out this amazing new restaurant that just opened.",
    imageUrl: "https://example.com/restaurant.jpg" // Optional
  },
  data: {
    category: "spot",
    spotId: "spot123",
    deepLink: "true",
    // Any other custom data
  }
}
```

## Sending Notifications

### To a Specific Device

```javascript
async function sendNotificationToDevice(fcmToken, title, body, category, additionalData = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: {
      category: category,
      ...additionalData
    },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
```

### To Multiple Devices

```javascript
async function sendNotificationToDevices(fcmTokens, title, body, category, additionalData = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: {
      category: category,
      ...additionalData
    },
    tokens: fcmTokens // Up to 500 tokens per request
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);
    
    // Handle failures if needed
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: fcmTokens[idx],
            error: resp.error
          });
        }
      });
      console.log('List of tokens that caused failures:', failedTokens);
    }
    
    return response;
  } catch (error) {
    console.error('Error sending messages:', error);
    throw error;
  }
}
```

### To a Topic

First, subscribe devices to a topic:

```javascript
async function subscribeToTopic(fcmTokens, topic) {
  try {
    const response = await admin.messaging().subscribeToTopic(fcmTokens, topic);
    console.log('Successfully subscribed to topic:', response);
    return response;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
}
```

Then send notifications to that topic:

```javascript
async function sendNotificationToTopic(topic, title, body, category, additionalData = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: {
      category: category,
      ...additionalData
    },
    topic: topic
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message to topic:', response);
    return response;
  } catch (error) {
    console.error('Error sending message to topic:', error);
    throw error;
  }
}
```

## Notification Categories

The SPOTT app has predefined notification categories that should be used when sending notifications:

| Category | Description | Example Use Case |
|----------|-------------|-----------------|
| app_updates | App update notifications | New version available |
| bill_reminder | Payment reminders | Subscription due soon |
| promotion | Promotional offers | Limited time offer |
| discount | Discount offers | Special discount code |
| payment | Payment requests | Payment confirmation |
| new_service | New service announcements | New feature available |
| new_tips | Tips and tricks | How to use a feature |
| referral | Referral information | Friend joined using your code |
| location | Location alerts | Nearby point of interest |
| event | Event notifications | Upcoming event reminder |
| spot | Spot-related notifications | New spot discovered nearby |

## Deep Linking

To enable deep linking to specific screens when a notification is tapped, include the necessary navigation data:

```javascript
// Example: Deep link to a specific spot
sendNotificationToDevice(
  fcmToken,
  'New Spot Near You!',
  'Check out this amazing new restaurant that just opened.',
  'spot',
  {
    spotId: 'spot123',
    deepLink: 'true'
  }
);

// Example: Deep link to an event
sendNotificationToDevice(
  fcmToken,
  'Upcoming Event',
  'Don\'t miss this weekend\'s concert!',
  'event',
  {
    eventId: 'event456',
    deepLink: 'true'
  }
);
```

The app's router is configured to handle these deep links and navigate to the appropriate screen.

## User Preferences

The SPOTT app allows users to customize their notification preferences. The backend should respect these preferences by:

1. Maintaining a database of user preferences
2. Checking these preferences before sending notifications
3. Only sending notifications to users who have enabled that category

```javascript
async function sendNotificationRespectingPreferences(userId, fcmToken, title, body, category, additionalData = {}) {
  // First check if the user has enabled this category
  const userPrefs = await getUserNotificationPreferences(userId);
  
  if (userPrefs.general && userPrefs[category]) {
    return sendNotificationToDevice(fcmToken, title, body, category, additionalData);
  } else {
    console.log(`Notification not sent: User ${userId} has disabled ${category} notifications`);
    return null;
  }
}

// Example implementation of getting user preferences
async function getUserNotificationPreferences(userId) {
  // This would typically be a database query
  // Return an object with the user's notification preferences
  return {
    general: true,
    app_updates: true,
    bill_reminder: true,
    promotion: false,
    // ... other categories
  };
}
```

## Handling Notification Images

The SPOTT app supports images in notifications. To include an image:

```javascript
const message = {
  notification: {
    title: 'Check out this photo!',
    body: 'A beautiful sunset at the beach',
    imageUrl: 'https://example.com/sunset.jpg'
  },
  data: {
    category: 'new_tips',
    imageUrl: 'https://example.com/sunset.jpg' // Include in data too for consistency
  },
  token: fcmToken
};
```

For Android, you may need to use the `android` configuration:

```javascript
const message = {
  notification: {
    title: 'Check out this photo!',
    body: 'A beautiful sunset at the beach',
  },
  android: {
    notification: {
      imageUrl: 'https://example.com/sunset.jpg',
    }
  },
  data: {
    category: 'new_tips',
    imageUrl: 'https://example.com/sunset.jpg'
  },
  token: fcmToken
};
```

For iOS, use the `apns` configuration:

```javascript
const message = {
  notification: {
    title: 'Check out this photo!',
    body: 'A beautiful sunset at the beach',
  },
  apns: {
    payload: {
      aps: {
        'mutable-content': 1
      },
      fcmOptions: {
        imageUrl: 'https://example.com/sunset.jpg'
      }
    }
  },
  data: {
    category: 'new_tips',
    imageUrl: 'https://example.com/sunset.jpg'
  },
  token: fcmToken
};
```

## Testing Notifications

You can use this function to test your notification setup:

```javascript
async function testAllNotificationCategories(fcmToken) {
  const categories = [
    'app_updates',
    'bill_reminder',
    'promotion',
    'discount',
    'payment',
    'new_service',
    'new_tips',
    'referral',
    'location',
    'event',
    'spot'
  ];
  
  for (const category of categories) {
    await sendNotificationToDevice(
      fcmToken,
      `Test ${category} Notification`,
      `This is a test notification for the ${category} category.`,
      category
    );
    
    // Wait a bit between notifications
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('All test notifications sent');
}
```

## Handling Notification Analytics

Track notification delivery and engagement:

```javascript
async function sendNotificationWithAnalytics(userId, fcmToken, title, body, category, additionalData = {}) {
  // Add a unique ID to track this notification
  const notificationId = generateUniqueId();
  
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: {
      category: category,
      notificationId: notificationId,
      ...additionalData
    },
    token: fcmToken,
    android: {
      // Enable notification analytics
      notification: {
        clickAction: 'OPEN_ACTIVITY_1'
      }
    },
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
          'content-available': 1
        }
      }
    }
  };
  
  // Store notification in your database for analytics
  await storeNotificationForAnalytics(notificationId, userId, title, body, category);
  
  return admin.messaging().send(message);
}

// Example implementation of storing notification for analytics
async function storeNotificationForAnalytics(notificationId, userId, title, body, category) {
  // This would typically be a database insert
  console.log(`Storing notification ${notificationId} for user ${userId}`);
  
  // Example database entry
  const notificationEntry = {
    id: notificationId,
    userId: userId,
    title: title,
    body: body,
    category: category,
    sentAt: new Date(),
    status: 'sent',
    openedAt: null
  };
  
  // Save to database
  // await db.collection('notifications').add(notificationEntry);
}

// Generate a unique ID for the notification
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Notification not showing on device**
   - Check if the device has notifications enabled for the app
   - Verify the FCM token is valid and up-to-date
   - Ensure the notification payload is correctly formatted

2. **Deep links not working**
   - Verify the deep link parameters are correctly formatted
   - Check if the app's router is properly configured to handle the deep link
   - Ensure the user has the latest version of the app

3. **Images not displaying in notifications**
   - Verify the image URL is publicly accessible
   - Check if the image format is supported (JPEG, PNG)
   - Ensure the image size is appropriate (recommended: under 1MB)

4. **Notification analytics not working**
   - Verify the notification ID is being properly generated and stored
   - Check if the click action is correctly configured
   - Ensure the app is properly reporting notification interactions

### Debugging Tips

1. Use the Firebase Console to send test notifications and verify basic functionality
2. Implement logging in both the backend and the app to track notification flow
3. Test on multiple device types and OS versions to ensure compatibility
4. Use Firebase Analytics to track notification delivery and engagement metrics

### Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| messaging/invalid-argument | Invalid argument provided | Check the notification payload format |
| messaging/invalid-recipient | Invalid recipient | Verify the FCM token is valid |
| messaging/authentication-error | Authentication error | Check your Firebase Admin credentials |
| messaging/server-unavailable | Server unavailable | Retry with exponential backoff |
| messaging/quota-exceeded | Quota exceeded | Reduce notification frequency or request quota increase |
| messaging/sender-id-mismatch | Sender ID mismatch | Verify the sender ID matches your Firebase project |

For more information, refer to the [Firebase Cloud Messaging documentation](https://firebase.google.com/docs/cloud-messaging). 