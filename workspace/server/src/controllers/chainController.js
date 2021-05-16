const blockchain = require('../database/BlockchainDB');

console.log(blockchain);
exports.getBlocks = async (req, res, next) => {
  const blocks = await blockchain.getBlockchain();
  res.status(200).json({
    status: 'success',
    length: blocks.length,
    data: blocks
  });
};

exports.mineBlock = async (req, res, next) => {
  const newBlock = blockchain.generateNextBlock(req.body.data);
  res.status(200).json({
    status: 'success',
    data: newBlock
  });
};
