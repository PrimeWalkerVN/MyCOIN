const express = require('express');

const router = express.Router();
const walletController = require('../controllers/walletController');
const chainController = require('../controllers/chainController');

router.post('/access', walletController.accessWallet);
router.delete('/delete', walletController.deleteWallet);

router.get('/balance', chainController.getBalance);
router.get('/address', chainController.getAddress);

module.exports = router;
