const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/authorize');
const {
    validateCreateChat,
    validateAddMessage,
    validateGetChats,
    validateUpdateChatStatus
} = require('../middleware/chatValidation');
const {
    createChat,
    addMessage,
    getUserChats,
    getAdminChats,
    getChatDetails,
    assignAdmin,
    updateChatStatus
} = require('../controllers/chat.controller');
const { cache } = require('../config/redis');

// User routes
router.post('/create', authenticateUser, validateCreateChat, createChat);
router.post('/message', authenticateUser, validateAddMessage, addMessage);
router.get('/user', authenticateUser, validateGetChats, getUserChats);
router.get('/:chatId', authenticateUser, getChatDetails);

// Admin routes
router.get('/admin', authenticateUser, authorizeAdmin, validateGetChats, getAdminChats);
router.post('/:chatId/assign', authenticateUser, authorizeAdmin, assignAdmin);
router.put('/:chatId/status', authenticateUser, authorizeAdmin, validateUpdateChatStatus, updateChatStatus);

module.exports = router; 