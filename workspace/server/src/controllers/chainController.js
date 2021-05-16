const _ = require('lodash');
const {
  generateNextBlock,
  generatenextBlockWithTransaction,
  generateRawNextBlock,
  getAccountBalance,
  getBlockchain,
  getMyUnspentTransactionOutputs,
  getUnspentTxOuts,
  sendTransaction
} = require('../models/BlockChain.js');
const { connectToPeers, getSockets } = require('../models/P2P');
const { getTransactionPool } = require('../models/Wallet');
const { getPublicFromWallet } = require('../models/Wallet');

exports.getBlocks = async (req, res, next) => {
  res.send(getBlockchain());
};

exports.findBlockWithHash = async (req, res, next) => {
  const block = _.find(getBlockchain(), { hash: req.params.hash });
  res.send(block);
};

exports.getTransactionWithId = async (req, res, next) => {
  const tx = _(getBlockchain())
    .map((blocks) => blocks.data)
    .flatten()
    .find({ id: req.params.id });
  res.send(tx);
};

exports.getTransactionsFromAddress = async (req, res, next) => {
  const unspentTxOuts = _.filter(getUnspentTxOuts(), (uTxO) => uTxO.address === req.params.address);
  res.send({ unspentTxOuts });
};

exports.getUnspentTransactionOutputs = async (req, res, next) => {
  res.send(getUnspentTxOuts());
};

exports.getMyUnspentTransactionOutputs = async (req, res, next) => {
  res.send(getMyUnspentTransactionOutputs());
};

exports.mineRawBlock = async (req, res, next) => {
  if (req.body.data == null) {
    res.status(400).send('data parameter is missing');
    return;
  }
  const newBlock = generateRawNextBlock(req.body.data);
  if (newBlock === null) {
    res.status(400).send('could not generate block');
  } else {
    res.send(newBlock);
  }
};

exports.mineBlock = async (req, res, next) => {
  const newBlock = generateNextBlock();
  if (newBlock === null) {
    res.status(400).send('could not generate block');
  } else {
    res.send(newBlock);
  }
};

exports.getBalance = async (req, res, next) => {
  const balance = getAccountBalance();
  res.send({ balance });
};

exports.getAddress = async (req, res, next) => {
  const address = getPublicFromWallet();
  res.send({ address });
};

exports.mineTransaction = async (req, res, next) => {
  const { address } = req.body;
  const { amount } = req.body;
  try {
    const resp = generatenextBlockWithTransaction(address, amount);
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
    const resp = sendTransaction(address, amount);
    res.send(resp);
  } catch (e) {
    console.log(e.message);
    res.status(400).send(e.message);
  }
};

exports.getTransactionPool = async (req, res, next) => {
  res.send(getTransactionPool());
};

exports.getPeers = async (req, res, next) => {
  // eslint-disable-next-line no-underscore-dangle
  res.send(getSockets().map((s) => `${s._socket.remoteAddress}:${s._socket.remotePort}`));
};

exports.addPeer = async (req, res, next) => {
  connectToPeers(req.body.peer);
  res.send();
};

exports.stopServer = async (req, res, next) => {
  res.send({ msg: 'stopping server' });
  process.exit();
};
