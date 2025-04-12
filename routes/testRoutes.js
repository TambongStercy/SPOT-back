const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const notificationServices = require('../services/notification.services');

/**
 * @route POST /api/test/notifications/user
 * @desc Test sending a notification to a specific user
 * @access Public
 */
router.post('/notifications/user', async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'userId, title, and body are required'
            });
        }

        const result = await notificationService.sendUserNotification(
            userId,
            { title, body },
            data || {}
        );

        res.json({
            success: true,
            message: 'Notification test executed',
            result
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message
        });
    }
});

/**
 * @route POST /api/test/notifications/chat
 * @desc Test sending a chat notification
 * @access Public
 */
router.post('/notifications/chat', async (req, res) => {
    try {
        const { userId, senderId, chatId, content } = req.body;

        if (!userId || !senderId || !chatId || !content) {
            return res.status(400).json({
                success: false,
                message: 'userId, senderId, chatId, and content are required'
            });
        }

        const chatData = {
            senderId,
            chatId,
            messageId: Date.now().toString(),
            content
        };

        const result = await notificationService.sendChatNotification(userId, chatData);

        res.json({
            success: true,
            message: 'Chat notification test executed',
            result
        });
    } catch (error) {
        console.error('Test chat notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test chat notification',
            error: error.message
        });
    }
});

/**
 * @route POST /api/test/notifications/admin
 * @desc Test sending a notification to all admin users
 * @access Public
 */
router.post('/notifications/admin', async (req, res) => {
    try {
        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'title and body are required'
            });
        }

        const result = await notificationService.sendAdminNotification(
            { title, body },
            data || {}
        );

        res.json({
            success: true,
            message: 'Admin notification test executed',
            result
        });
    } catch (error) {
        console.error('Test admin notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test admin notification',
            error: error.message
        });
    }
});

/**
 * @route POST /api/test/notifications/new-chat
 * @desc Test sending a new chat notification to admins
 * @access Public
 */
router.post('/notifications/new-chat', async (req, res) => {
    try {
        const { userId, chatId, subject } = req.body;

        if (!userId || !chatId || !subject) {
            return res.status(400).json({
                success: false,
                message: 'userId, chatId, and subject are required'
            });
        }

        const chatData = {
            userId,
            chatId,
            subject
        };

        const result = await notificationService.sendNewChatNotification(chatData);

        res.json({
            success: true,
            message: 'New chat notification test executed',
            result
        });
    } catch (error) {
        console.error('Test new chat notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test new chat notification',
            error: error.message
        });
    }
});

/**
 * @route POST /api/test/notifications/collapsible
 * @desc Test sending a collapsible notification
 * @access Public
 */
router.post('/notifications/collapsible', async (req, res) => {
    try {
        const { deviceToken, collapseKey, title, body, data } = req.body;

        if (!deviceToken || !collapseKey || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'deviceToken, collapseKey, title, and body are required'
            });
        }

        await notificationServices.sendCollapsibleNotification(
            deviceToken,
            collapseKey,
            title,
            body,
            data || {}
        );

        res.json({
            success: true,
            message: 'Collapsible notification test executed'
        });
    } catch (error) {
        console.error('Test collapsible notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test collapsible notification',
            error: error.message
        });
    }
});

/**
 * @route POST /api/test/notifications/non-collapsible
 * @desc Test sending a non-collapsible notification
 * @access Public
 */
router.post('/notifications/non-collapsible', async (req, res) => {
    try {
        const { deviceToken, title, body, data } = req.body;

        if (!deviceToken || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'deviceToken, title, and body are required'
            });
        }

        await notificationServices.sendNonCollapsibleNotification(
            deviceToken,
            title,
            body,
            data || {}
        );

        res.json({
            success: true,
            message: 'Non-collapsible notification test executed'
        });
    } catch (error) {
        console.error('Test non-collapsible notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test non-collapsible notification',
            error: error.message
        });
    }
});

/**
 * @route GET /api/test/notifications/status
 * @desc Check if notification services are properly configured
 * @access Public
 */
router.get('/notifications/status', async (req, res) => {
    try {
        // Check if Firebase Admin SDK is initialized
        let firebaseStatus = false;
        try {
            const admin = require('firebase-admin');
            firebaseStatus = admin.apps.length > 0;
        } catch (error) {
            console.error('Firebase Admin SDK error:', error);
        }

        res.json({
            success: true,
            status: {
                firebaseInitialized: firebaseStatus,
                notificationServiceAvailable: !!notificationService,
                notificationServicesAvailable: !!notificationServices
            }
        });
    } catch (error) {
        console.error('Notification status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check notification status',
            error: error.message
        });
    }
});

module.exports = router; 