const express = require('express');

const router = express.Router();
const chainController = require('../controllers/chainController');

router.get('/blocks', chainController.getBlocks);
router.get('/block/:hash', chainController.findBlockWithHash);
router.get('/latest', chainController.getLatestBlock);
router.get('/transaction/:id', chainController.getTransactionWithId);
router.get('/address/:address', chainController.getTransactionsFromAddress);
router.get('/unspentTransactionOutputs', chainController.getUnspentTransactionOutputs);
router.get('/myUnspentTransactionOutputs', chainController.getMyUnspentTransactionOutputs);
router.get('/transaction', chainController.getTransaction);

router.post('/mineRawBlock', chainController.mineRawBlock);
router.post('/mineBlock', chainController.mineBlock);

router.post('/mineTransaction', chainController.mineTransaction);
router.post('/sendTransaction', chainController.sendTransaction);

router.get('/transactionPool', chainController.getTransactionPool);
router.get('/peers', chainController.getPeers);

router.post('/addPeer', chainController.addPeer);
router.post('/stop', chainController.stopServer);
module.exports = router;
