const express = require('express');
const router = express.Router();
const { getMedicos, getMiMedico, createMedico, updateMedico, deleteMedico } = require('../controllers/medicos.controller');

router.get('/', getMedicos);
router.get('/me', getMiMedico);
router.post('/', createMedico);
router.put('/:id', updateMedico);
router.delete('/:id', deleteMedico);

module.exports = router;
