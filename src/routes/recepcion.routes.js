const express = require('express');
const router = express.Router();
const { registrarIngreso } = require('../controllers/recepcion.controller');

router.post('/', registrarIngreso);

module.exports = router;
