const express = require('express');

const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/access', walletController.accessWallet);

module.exports = router;
