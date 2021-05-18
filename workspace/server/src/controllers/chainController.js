const _ = require('lodash');
const chain = require('../models/BlockChain');
const { getPublicFromWallet } = require('../models/Wallet');
const AppError = require('../utils/AppError.js');

exports.getBlocks = async (req, res, next) => {
  res.send(chain.getBlockchain());
};

exports.findBlockWithHash = async (req, res, next) => {
  const block = _.find(chain.getBlockchain(), { hash: req.params.hash });
  res.send(block);
};

exports.getLatestBlock = async (req, res, next) => {
  const block = chain.getLatestBlock();
  console.log(block);
  res.status(200).json({
    status: 'success',
    data: block
  });
};

exports.getTransactionWithId = async (req, res, next) => {
  const tx = _(chain.getBlockchain())
    .map((blocks) => blocks.data)
    .flatten()
    .find({ id: req.params.id });
  res.send(tx);
};

exports.getTransactionsFromAddress = async (req, res, next) => {
  const unspentTxOuts = _.filter(chain.getUnspentTxOuts(), (uTxO) => uTxO.address === req.params.address);
  res.send({ unspentTxOuts });
};

exports.getUnspentTransactionOutputs = async (req, res, next) => {
  res.send(chain.getUnspentTxOuts());
};

exports.getMyUnspentTransactionOutputs = async (req, res, next) => {
  res.send(chain.getMyUnspentTransactionOutputs());
};

exports.mineRawBlock = async (req, res, next) => {
  if (req.body.data == null) {
    res.status(400).send('data parameter is missing');
    return;
  }
  const newBlock = chain.generateRawNextBlock(req.body.data);
  if (newBlock === null) {
    res.status(400).send('could not generate block');
  } else {
    res.send(newBlock);
  }
};

exports.mineBlock = async (req, res, next) => {
  const newBlock = chain.generateNextBlock();
  if (newBlock === null) {
    res.status(400).send('could not generate block');
  } else {
    res.send(newBlock);
  }
};

exports.getBalance = async (req, res, next) => {
  const balance = chain.getAccountBalance();
  res.send({ balance });
};

exports.getAddress = async (req, res, next) => {
  const address = getPublicFromWallet();
  res.send({ address });
};

exports.getTransaction = async (req, res, next) => {
  const data = chain.getTransaction();
  res.status(200).json({
    data
  });
};

exports.mineTransaction = async (req, res, next) => {
  const { address } = req.body;
  const { amount } = req.body;
  try {
    const resp = chain.generateNextBlockWithTransaction(address, amount);
    res.send(resp);
  } catch (e) {
    console.log(e.message);
    res.status(400).send(e.message);
  }
};

exports.sendTransaction = async (req, res, next) => {
  try {
    const { address } = req.body;
    const { amount } = req.body;

    if (address === undefined || amount === undefined) {
      throw Error('invalid address or amount');
    }
    const resp = chain.sendTransaction(address, Number(amount));
    res.status(200).json({
      status: 'success',
      data: resp
    });
  } catch (e) {
    console.log(e.message);
    res.status(400).send(e.message);
  }
};

exports.getTransactionPool = async (req, res, next) => {
  res.send(chain.getTransactionPool());
};

exports.getPeers = async (req, res, next) => {
  // eslint-disable-next-line no-underscore-dangle
  res.send(chain.getSockets().map((s) => `${s._socket.remoteAddress}:${s._socket.remotePort}`));
};

exports.addPeer = async (req, res, next) => {
  try {
    chain.connectToPeers(req.body.peer);
    return res.send();
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

exports.stopServer = async (req, res, next) => {
  res.send({ msg: 'stopping server' });
  process.exit();
};
