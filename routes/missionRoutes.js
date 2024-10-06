const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');

router.post('/create-prestation', missionController.createPrestation);
router.post('/get-all-prestation', missionController.getAllPrestation);
router.post('/get-prestation', missionController.getPrestation);
router.post('/save-prestation-description', missionController.savePrestationDescription);
router.post('/create-experience', missionController.createExperience);
router.post('/get-all-experience', missionController.getAllExperience);
router.post('/get-all-prestation-search', missionController.getAllPrestationSearch);
router.post('/get-all-metier-names', missionController.getAllMetierNames);
router.post('/get-metier-by-name', missionController.getMetierByName);

module.exports = router;