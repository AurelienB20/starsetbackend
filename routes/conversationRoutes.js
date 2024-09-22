const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/get-conversation', conversationController.getConversation);
router.post('/send-message', conversationController.sendMessage);
router.post('/get-conversation-with-id', conversationController.getConversationWithId);
router.post('/get-all-messages-by-conversation-id', conversationController.getMessagesByConversationId);
router.post('/get-all-worker-conversation', conversationController.getAllWorkerConversation);


module.exports = router;