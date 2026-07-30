const express = require('express');
const router = express.Router();
const { getPacientes, createPaciente, deletePaciente} = require('../controllers/pacientes.controller');

router.get('/', getPacientes);
router.post('/', createPaciente);
router.delete('/:id', deletePaciente);

module.exports = router;
