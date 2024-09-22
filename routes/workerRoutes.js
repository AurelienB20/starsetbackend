const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

router.post('/create-worker', workerController.createWorker);

module.exports = router;