const admin = require('../config/fcmConfig');

// Function to send non-collapsible notification
exports.sendNonCollapsibleNotification = async (deviceToken, title, body, data) => {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        data: data,  // Additional data payload
        token: deviceToken,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent non-collapsible notification:', response);
    } catch (error) {
        console.error('Error sending non-collapsible notification:', error);
        throw new Error('Notification sending failed');
    }
};

// Function to send collapsible notification
exports.sendCollapsibleNotification = async (deviceToken, collapseKey, title, body, data) => {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        data: data,  // Additional data payload
        token: deviceToken,
        android: {
            collapse_key: collapseKey,  // Set the collapse key for collapsible notifications
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent collapsible notification:', response);
    } catch (error) {
        console.error('Error sending collapsible notification:', error);
        throw new Error('Notification sending failed');
    }
};
