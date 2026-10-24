const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/update-account', authController.updateAccount);
router.post('/update-account-description', authController.updateAccountDescription);
router.post('/get-account-by-id', authController.getAccountById);

module.exports = router;
