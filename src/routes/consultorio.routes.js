const express = require('express');
const router = express.Router();
const { getConsultorios, createConsultorio } = require('../controllers/consultorios.controller');

router.get('/', getConsultorios);
router.post('/', createConsultorio);

module.exports = router;
