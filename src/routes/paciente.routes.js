const express = require('express');
const router = express.Router();
const { getPacientes, createPaciente, updatePaciente, deletePaciente} = require('../controllers/pacientes.controller');

router.get('/', getPacientes);
router.post('/', createPaciente);
router.put('/:id', updatePaciente);
router.delete('/:id', deletePaciente);

module.exports = router;
