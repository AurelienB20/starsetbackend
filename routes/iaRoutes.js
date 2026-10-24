const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');

router.post('/create-prestation', iaController.createPrestation);

module.exports = router;