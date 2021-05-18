const express = require('express');

const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/access', walletController.accessWallet);
router.delete('/delete', walletController.deleteWallet);

module.exports = router;
