const express = require('express');
const router = express.Router();
const { getMedicos, createMedico } = require('../controllers/medicos.controller');

router.get('/', getMedicos);
router.post('/', createMedico);

module.exports = router;
