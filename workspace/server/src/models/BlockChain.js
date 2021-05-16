const _ = require('lodash');
const SHA256 = require('crypto-js/sha256');
const TxOut = require('./Transaction/TxOut');
const { broadcastLatest, broadCastTransactionPool } = require('./P2P');
const { Transaction, getCoinbaseTransaction, processTransactions } = require('./Transaction/Transaction');
const { hexToBinary } = require('../utils/hexToBinary');
const TransactionPool = require('./TransactionPool');
const { createTransaction, findUnspentTxOuts, getBalance, getPrivateFromWallet, getPublicFromWallet } = require('./Wallet');

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const genesisTransaction = new Transaction(
  [{ signature: '', txOutId: '', txOutIndex: 0 }],
  [
    {
      address: '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
      amount: 50
    }
  ]
);

const genesisBlock = new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 0, 0);

// Blockchain
let blockchain = [genesisBlock];

// TransactionPool
const transactionPool = new TransactionPool([]);

// the unspent txOut of genesis block is set to unspentTxOuts on startup
let unspentTxOuts = processTransactions(blockchain[0].data, [], 0);

const getBlockchain = () => blockchain;

const getUnspentTxOuts = () => _.cloneDeep(unspentTxOuts);

const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

// and txPool should be only updated at the same time
const setUnspentTxOuts = (newUnspentTxOut) => {
  console.log('replacing unspentTxouts with: %s', newUnspentTxOut);
  unspentTxOuts = newUnspentTxOut;
};

const getLatestBlock = () => blockchain[blockchain.length - 1];

// in seconds
const BLOCK_GENERATION_INTERVAL = 10;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();

const calculateHashForBlock = (block) => calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredPrefix = '0'.repeat(difficulty);
  return hashInBinary.startsWith(requiredPrefix);
};

const hashMatchesBlockContent = (block) => {
  const blockHash = calculateHashForBlock(block);
  return blockHash === block.hash;
};

const hasValidHash = (block) => {
  if (!hashMatchesBlockContent(block)) {
    console.log(`invalid hash, got:${block.hash}`);
    return false;
  }

  if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
    console.log(`block difficulty not satisfied. Expected: ${block.difficulty}got: ${block.hash}`);
  }
  return true;
};

const isValidTimestamp = (newBlock, previousBlock) =>
  previousBlock.timestamp - 60 < newBlock.timestamp && newBlock.timestamp - 60 < getCurrentTimestamp();

const isValidBlockStructure = (block) =>
  typeof block.index === 'number' &&
  typeof block.hash === 'string' &&
  typeof block.previousHash === 'string' &&
  typeof block.timestamp === 'number' &&
  typeof block.data === 'object';

const isValidNewBlock = (newBlock, previousBlock) => {
  if (!isValidBlockStructure(newBlock)) {
    console.log('invalid block structure: %s', JSON.stringify(newBlock));
    return false;
  }
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('invalid index');
    return false;
  }
  if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash');
    return false;
  }
  if (!isValidTimestamp(newBlock, previousBlock)) {
    console.log('invalid timestamp');
    return false;
  }
  if (!hasValidHash(newBlock)) {
    return false;
  }
  return true;
};

const getAdjustedDifficulty = (latestBlock, aBlockchain) => {
  const prevAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return prevAdjustmentBlock.difficulty + 1;
  }
  if (timeTaken > timeExpected * 2) {
    return prevAdjustmentBlock.difficulty - 1;
  }
  return prevAdjustmentBlock.difficulty;
};

const getDifficulty = (aBlockchain) => {
  const latestBlock = aBlockchain[blockchain.length - 1];
  if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
    return getAdjustedDifficulty(latestBlock, aBlockchain);
  }
  return latestBlock.difficulty;
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  while (true) {
    const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
    }
    nonce++;
  }
};

const addBlockToChain = (newBlock) => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    const retVal = processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
    if (retVal === null) {
      console.log('block is not valid in terms of transactions');
      return false;
    }
    blockchain.push(newBlock);
    setUnspentTxOuts(retVal);
    transactionPool.updateTransactionPool(unspentTxOuts);
    return true;
  }
  return false;
};

const generateRawNextBlock = (blockData) => {
  const previousBlock = getLatestBlock();
  const difficulty = getDifficulty(getBlockchain());
  const nextIndex = previousBlock.index + 1;
  const nextTimestamp = getCurrentTimestamp();
  const newBlock = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
  if (addBlockToChain(newBlock)) {
    broadcastLatest();
    return newBlock;
  }
  return null;
};

// gets the unspent transaction outputs owned by the wallet
const getMyUnspentTransactionOutputs = () => findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts());

const generateNextBlock = () => {
  const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
  const blockData = [coinbaseTx].concat(transactionPool.getTransactionPool());
  return generateRawNextBlock(blockData);
};

const generatenextBlockWithTransaction = (receiverAddress, amount) => {
  const txOut = new TxOut(receiverAddress, amount);
  if (!txOut.isValidAddress(receiverAddress)) {
    throw Error('invalid address');
  }
  if (typeof amount !== 'number') {
    throw Error('invalid amount');
  }
  const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
  const tx = createTransaction(receiverAddress, amount, getPrivateFromWallet(), getUnspentTxOuts(), transactionPool.getTransactionPool());
  const blockData = [coinbaseTx, tx];
  return generateRawNextBlock(blockData);
};

const getAccountBalance = () => getBalance(getPublicFromWallet(), getUnspentTxOuts());

const sendTransaction = (address, amount) => {
  const tx = createTransaction(address, amount, getPrivateFromWallet(), getUnspentTxOuts(), transactionPool.getTransactionPool());
  transactionPool.addToTransactionPool(tx, getUnspentTxOuts());
  broadCastTransactionPool();
  return tx;
};

const getAccumulatedDifficulty = (aBlockchain) =>
  aBlockchain
    .map((block) => block.difficulty)
    // eslint-disable-next-line no-restricted-properties
    .map((difficulty) => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);

/*
    Checks if the given blockchain is valid. Return the unspent txOuts if the chain is valid
 */
const isValidChain = (blockchainToValidate) => {
  console.log('isValidChain:');
  console.log(JSON.stringify(blockchainToValidate));
  const isValidGenesis = (block) => JSON.stringify(block) === JSON.stringify(genesisBlock);

  if (!isValidGenesis(blockchainToValidate[0])) {
    return null;
  }
  /*
    Validate each block in the chain. The block is valid if the block structure is valid
      and the transaction are valid
     */
  let aUnspentTxOuts = [];

  for (let i = 0; i < blockchainToValidate.length; i++) {
    const currentBlock = blockchainToValidate[i];
    if (i !== 0 && !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
      return null;
    }

    aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
    if (aUnspentTxOuts === null) {
      console.log('invalid transactions in blockchain');
      return null;
    }
  }
  return aUnspentTxOuts;
};

const replaceChain = (newBlocks) => {
  const aUnspentTxOuts = isValidChain(newBlocks);
  const validChain = aUnspentTxOuts !== null;
  if (validChain && getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
    blockchain = newBlocks;
    setUnspentTxOuts(aUnspentTxOuts);
    transactionPool.updateTransactionPool(unspentTxOuts);
    broadcastLatest();
  } else {
    console.log('Received blockchain invalid');
  }
};

const handleReceivedTransaction = (transaction) => {
  transactionPool.addToTransactionPool(transaction, getUnspentTxOuts());
};

module.exports = {
  Block,
  getBlockchain,
  getUnspentTxOuts,
  getLatestBlock,
  sendTransaction,
  generateRawNextBlock,
  generateNextBlock,
  generatenextBlockWithTransaction,
  handleReceivedTransaction,
  getMyUnspentTransactionOutputs,
  getAccountBalance,
  isValidBlockStructure,
  replaceChain,
  addBlockToChain,
  transactionPool
};
