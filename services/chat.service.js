const Chat = require('../models/Chat');
const User = require('../models/User');
const notificationService = require('./notification.service');
const mongoose = require('mongoose');

/**
 * Create a new support chat
 * @param {Object} chatData - Chat data
 * @param {String} chatData.userId - User ID
 * @param {String} chatData.subject - Chat subject
 * @param {String} chatData.message - Initial message
 * @returns {Promise<Object>} - Created chat
 */
exports.createChat = async (chatData) => {
    const { userId, subject, message } = chatData;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Create new chat
    const chat = new Chat({
        user: userId,
        subject,
        status: 'open',
        messages: [{
            sender: userId,
            content: message,
            isRead: false
        }],
        lastMessage: new Date(),
        userUnreadCount: 0,
        adminUnreadCount: 1
    });

    // Save chat
    await chat.save();

    // Send notification to admins
    await notificationService.sendNewChatNotification({
        chatId: chat._id.toString(),
        userId,
        subject
    });

    return chat;
};

/**
 * Add a message to a chat
 * @param {Object} messageData - Message data
 * @param {String} messageData.chatId - Chat ID
 * @param {String} messageData.senderId - Sender user ID
 * @param {String} messageData.content - Message content
 * @param {Array} messageData.attachments - Message attachments
 * @returns {Promise<Object>} - Updated chat
 */
exports.addMessage = async (messageData) => {
    const { chatId, senderId, content, attachments = [] } = messageData;

    // Validate chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new Error('Chat not found');
    }

    // Validate sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
        throw new Error('Sender not found');
    }

    // Check if sender is the user or an admin
    const isAdmin = sender.role === 'admin';
    const isUser = chat.user.toString() === senderId;

    if (!isAdmin && !isUser) {
        throw new Error('Unauthorized to send message in this chat');
    }

    // Create new message
    const message = {
        sender: senderId,
        content,
        isRead: false,
        attachments,
        createdAt: new Date()
    };

    // Update chat
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { messages: message },
            lastMessage: new Date(),
            $inc: {
                userUnreadCount: isAdmin ? 1 : 0,
                adminUnreadCount: isAdmin ? 0 : 1
            }
        },
        { new: true }
    );

    // Get the newly added message
    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

    // Send notification
    if (isAdmin) {
        // Admin sent message, notify user
        await notificationService.sendChatNotification(chat.user.toString(), {
            chatId: chat._id.toString(),
            messageId: newMessage._id.toString(),
            senderId: senderId,
            content
        });
    } else {
        // User sent message, notify assigned admin or all admins
        if (chat.admin) {
            await notificationService.sendChatNotification(chat.admin.toString(), {
                chatId: chat._id.toString(),
                messageId: newMessage._id.toString(),
                senderId: senderId,
                content
            });
        } else {
            // No admin assigned, notify all admins
            await notificationService.sendAdminNotification(
                {
                    title: 'New Support Message',
                    body: `New message in chat: ${chat.subject}`
                },
                {
                    category: 'chat',
                    chatId: chat._id.toString(),
                    messageId: newMessage._id.toString(),
                    senderId: senderId,
                    content: content.length > 50 ? content.substring(0, 47) + '...' : content,
                    timestamp: new Date().toISOString(),
                    deepLink: 'true',
                    type: 'new_message'
                }
            );
        }
    }

    return updatedChat;
};

/**
 * Get user's chats
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number
 * @param {Number} options.limit - Items per page
 * @param {String} options.status - Chat status filter
 * @returns {Promise<Object>} - Paginated chats
 */
exports.getUserChats = async (userId, options = {}) => {
    const { page = 1, limit = 20, status } = options;

    // Build query
    const query = { user: userId };
    if (status) {
        query.status = status;
    }

    // Count total chats
    const total = await Chat.countDocuments(query);

    // Get paginated chats
    const chats = await Chat.find(query)
        .sort({ lastMessage: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('admin', 'name username')
        .lean();

    // Format chats for response
    const formattedChats = chats.map(chat => ({
        id: chat._id,
        subject: chat.subject,
        status: chat.status,
        lastMessage: chat.lastMessage,
        unreadCount: chat.userUnreadCount,
        admin: chat.admin,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
    }));

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalChats: total,
        chats: formattedChats,
        hasMore: (page - 1) * limit + formattedChats.length < total
    };
};

/**
 * Get admin chats
 * @param {String} adminId - Admin ID
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number
 * @param {Number} options.limit - Items per page
 * @param {String} options.status - Chat status filter
 * @returns {Promise<Object>} - Paginated chats
 */
exports.getAdminChats = async (adminId, options = {}) => {
    const { page = 1, limit = 20, status } = options;

    // Validate admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
        throw new Error('Unauthorized: Not an admin');
    }

    // Build query
    const query = {};
    if (status) {
        query.status = status;
    }

    // Count total chats
    const total = await Chat.countDocuments(query);

    // Get paginated chats
    const chats = await Chat.find(query)
        .sort({ lastMessage: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name username')
        .populate('admin', 'name username')
        .lean();

    // Format chats for response
    const formattedChats = chats.map(chat => ({
        id: chat._id,
        subject: chat.subject,
        status: chat.status,
        lastMessage: chat.lastMessage,
        unreadCount: chat.adminUnreadCount,
        user: chat.user,
        admin: chat.admin,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
    }));

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalChats: total,
        chats: formattedChats,
        hasMore: (page - 1) * limit + formattedChats.length < total
    };
};

/**
 * Get chat details with messages
 * @param {String} chatId - Chat ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Chat with messages
 */
exports.getChatDetails = async (chatId, userId) => {
    // Get chat with messages
    const chat = await Chat.findById(chatId)
        .populate('user', 'name username avatar')
        .populate('admin', 'name username avatar')
        .lean();

    if (!chat) {
        throw new Error('Chat not found');
    }

    // Check authorization
    const user = await User.findById(userId);
    const isAdmin = user && user.role === 'admin';
    const isUser = chat.user._id.toString() === userId;

    if (!isAdmin && !isUser) {
        throw new Error('Unauthorized to view this chat');
    }

    // Mark messages as read for the current user
    if (isAdmin) {
        await Chat.findByIdAndUpdate(chatId, { adminUnreadCount: 0 });

        // Mark admin messages as read
        await Chat.updateMany(
            { _id: chatId, 'messages.sender': userId, 'messages.isRead': false },
            { $set: { 'messages.$[elem].isRead': true } },
            { arrayFilters: [{ 'elem.sender': mongoose.Types.ObjectId(userId) }] }
        );
    } else {
        await Chat.findByIdAndUpdate(chatId, { userUnreadCount: 0 });

        // Mark user messages as read
        await Chat.updateMany(
            { _id: chatId, 'messages.sender': userId, 'messages.isRead': false },
            { $set: { 'messages.$[elem].isRead': true } },
            { arrayFilters: [{ 'elem.sender': mongoose.Types.ObjectId(userId) }] }
        );
    }

    return chat;
};

/**
 * Assign admin to chat
 * @param {String} chatId - Chat ID
 * @param {String} adminId - Admin ID
 * @returns {Promise<Object>} - Updated chat
 */
exports.assignAdmin = async (chatId, adminId) => {
    // Validate admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
        throw new Error('Unauthorized: Not an admin');
    }

    // Update chat
    const chat = await Chat.findByIdAndUpdate(
        chatId,
        { admin: adminId },
        { new: true }
    ).populate('user', 'name username').populate('admin', 'name username');

    if (!chat) {
        throw new Error('Chat not found');
    }

    return chat;
};

/**
 * Update chat status
 * @param {String} chatId - Chat ID
 * @param {String} status - New status
 * @param {String} adminId - Admin ID
 * @returns {Promise<Object>} - Updated chat
 */
exports.updateChatStatus = async (chatId, status, adminId) => {
    // Validate admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
        throw new Error('Unauthorized: Not an admin');
    }

    // Validate status
    if (!['open', 'closed', 'pending'].includes(status)) {
        throw new Error('Invalid status');
    }

    // Update chat
    const chat = await Chat.findByIdAndUpdate(
        chatId,
        { status },
        { new: true }
    );

    if (!chat) {
        throw new Error('Chat not found');
    }

    // Send notification to user about status change
    await notificationService.sendChatStatusNotification(chat.user.toString(), {
        chatId: chat._id.toString(),
        status,
        subject: chat.subject
    });

    return chat;
}; 