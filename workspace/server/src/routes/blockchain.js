const express = require('express');
const router = express.Router();
const chainController = require('../controllers/chainController');

router.get('/blocks', chainController.getBlocks);
router.post('/mineBlock', chainController.mineBlock);

module.exports = router;
