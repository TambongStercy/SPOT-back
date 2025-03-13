const chatService = require('../services/chat.service');

/**
 * Create a new support chat
 */
exports.createChat = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user.id;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Subject and message are required'
            });
        }

        const chat = await chatService.createChat({
            userId,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Support chat created successfully',
            chat
        });
    } catch (err) {
        console.error('Error creating support chat:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create support chat',
            error: err.message
        });
    }
};

/**
 * Add a message to a chat
 */
exports.addMessage = async (req, res) => {
    try {
        const { chatId, content, attachments } = req.body;
        const senderId = req.user.id;

        if (!chatId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID and content are required'
            });
        }

        const updatedChat = await chatService.addMessage({
            chatId,
            senderId,
            content,
            attachments
        });

        res.status(200).json({
            success: true,
            message: 'Message added successfully',
            chat: updatedChat
        });
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to add message',
            error: err.message
        });
    }
};

/**
 * Get user's chats
 */
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit, status } = req.query;

        const result = await chatService.getUserChats(userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error fetching user chats:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats',
            error: err.message
        });
    }
};

/**
 * Get admin chats
 */
exports.getAdminChats = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { page, limit, status } = req.query;

        const result = await chatService.getAdminChats(adminId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error fetching admin chats:', err);

        if (err.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: err.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch chats',
            error: err.message
        });
    }
};

/**
 * Get chat details with messages
 */
exports.getChatDetails = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required'
            });
        }

        const chat = await chatService.getChatDetails(chatId, userId);

        res.status(200).json({
            success: true,
            chat
        });
    } catch (err) {
        console.error('Error fetching chat details:', err);

        if (err.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: err.message
            });
        }

        if (err.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: err.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat details',
            error: err.message
        });
    }
};

/**
 * Assign admin to chat
 */
exports.assignAdmin = async (req, res) => {
    try {
        const { chatId } = req.params;
        const adminId = req.user.id;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required'
            });
        }

        const chat = await chatService.assignAdmin(chatId, adminId);

        res.status(200).json({
            success: true,
            message: 'Admin assigned to chat successfully',
            chat
        });
    } catch (err) {
        console.error('Error assigning admin to chat:', err);

        if (err.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: err.message
            });
        }

        if (err.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: err.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to assign admin to chat',
            error: err.message
        });
    }
};

/**
 * Update chat status
 */
exports.updateChatStatus = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { status } = req.body;
        const adminId = req.user.id;

        if (!chatId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID and status are required'
            });
        }

        const chat = await chatService.updateChatStatus(chatId, status, adminId);

        res.status(200).json({
            success: true,
            message: `Chat status updated to ${status}`,
            chat
        });
    } catch (err) {
        console.error('Error updating chat status:', err);

        if (err.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: err.message
            });
        }

        if (err.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: err.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update chat status',
            error: err.message
        });
    }
}; 