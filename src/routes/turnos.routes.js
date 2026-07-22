const express = require('express');
const router = express.Router();
const { getTurnos, createTurno, deleteTurno } = require('../controllers/turnos.controller');

router.get('/', getTurnos);
router.post('/', createTurno);
router.delete('/:id', deleteTurno);

module.exports = router;
