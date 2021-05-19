const _ = require('lodash');
const SHA256 = require('crypto-js/sha256');
const TxOut = require('./Transaction/TxOut');
const { Transaction, getCoinbaseTransaction, processTransactions } = require('./Transaction/Transaction');
// eslint-disable-next-line import/no-unresolved
const hexToBinary = require('../utils/hexToBinary');
const TransactionPool = require('./TransactionPool');
const { createTransaction, findUnspentTxOuts, getBalance, getPrivateFromWallet, getPublicFromWallet } = require('./Wallet');
const Block = require('./Block');
const PeerToPeer = require('./PeerToPeer');

const genesisTransaction = new Transaction(
  [{ signature: '', txOutId: '', txOutIndex: 0, from: '', to: '', amount: 0 }],
  [
    {
      address: '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
      amount: 50
    }
  ]
);

const genesisBlock = new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 8, 0);
const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

// in seconds
const BLOCK_GENERATION_INTERVAL = 10;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class BlockChain {
  constructor() {
    this.blockchain = [genesisBlock];
    this.transactionPool = new TransactionPool([]);
    // the unspent txOut of genesis block is set to unspentTxOuts on startup
    this.unspentTxOuts = processTransactions(this.blockchain[0].data, [], 0);
    this.peerToPeer = new PeerToPeer(this);
    this.transactions = [];
  }

  getTransactionPool() {
    return this.transactionPool.getTransactionPool();
  }

  getTransaction() {
    return this.transactions;
  }

  getBlockchain() {
    return this.blockchain;
  }

  getUnspentTxOuts() {
    return _.cloneDeep(this.unspentTxOuts);
  }

  getPeerToPeer() {
    return this.peerToPeer;
  }

  // and txPool should be only updated at the same time
  setUnspentTxOuts(newUnspentTxOut) {
    console.log('replacing unspentTxouts with: %s', newUnspentTxOut);
    this.unspentTxOuts = newUnspentTxOut;
  }

  addTransaction(txs) {
    console.log(txs);
    this.transactions = this.transactions.concat(txs);
    return this.transactions;
  }

  getLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }

  calculateHash(index, previousHash, timestamp, data, difficulty, nonce) {
    return SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();
  }

  calculateHashForBlock(block) {
    return this.calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
  }

  hashMatchesDifficulty(hash, difficulty) {
    if (difficulty < 0) return false;
    const hashInBinary = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
  }

  hashMatchesBlockContent(block) {
    const blockHash = this.calculateHashForBlock(block);
    console.log(blockHash);
    return blockHash === block.hash;
  }

  hasValidHash(block) {
    if (!this.hashMatchesBlockContent(block)) {
      console.log(`invalid hash, got:${block.hash}`);
      return false;
    }

    if (!this.hashMatchesDifficulty(block.hash, block.difficulty)) {
      console.log(`block difficulty not satisfied. Expected: ${block.difficulty}got: ${block.hash}`);
    }
    return true;
  }

  isValidTimestamp(newBlock, previousBlock) {
    return previousBlock.timestamp - 60 < newBlock.timestamp && newBlock.timestamp - 60 < getCurrentTimestamp();
  }

  isValidBlockStructure(block) {
    return (
      typeof block.index === 'number' &&
      typeof block.hash === 'string' &&
      typeof block.previousHash === 'string' &&
      typeof block.timestamp === 'number' &&
      typeof block.data === 'object'
    );
  }

  isValidNewBlock(newBlock, previousBlock) {
    if (!this.isValidBlockStructure(newBlock)) {
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
    if (!this.isValidTimestamp(newBlock, previousBlock)) {
      console.log('invalid timestamp');
      return false;
    }
    if (!this.hasValidHash(newBlock)) {
      console.log('invalid hash');
      return false;
    }
    return true;
  }

  getAdjustedDifficulty(latestBlock) {
    const prevAdjustmentBlock = this.blockchain[this.blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
    if (timeTaken < timeExpected / 2) {
      return prevAdjustmentBlock.difficulty + 1;
    }
    if (timeTaken > timeExpected * 2) {
      return prevAdjustmentBlock.difficulty - 1;
    }
    return prevAdjustmentBlock.difficulty;
  }

  getDifficulty() {
    const latestBlock = this.blockchain[this.blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
      return this.getAdjustedDifficulty(latestBlock);
    }
    return latestBlock.difficulty;
  }

  findBlock(index, previousHash, timestamp, data, difficulty) {
    let nonce = 0;
    while (true) {
      const hash = this.calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
      if (this.hashMatchesDifficulty(hash, difficulty)) {
        return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
      }
      nonce++;
    }
  }

  addBlockToChain(newBlock) {
    if (this.isValidNewBlock(newBlock, this.getLatestBlock())) {
      const retVal = processTransactions(newBlock.data, this.getUnspentTxOuts(), newBlock.index);
      if (retVal === null) {
        console.log('block is not valid in terms of transactions');
        return false;
      }
      this.blockchain.push(newBlock);
      this.setUnspentTxOuts(retVal);
      this.transactionPool.updateTransactionPool(this.unspentTxOuts);
      return true;
    }
    return false;
  }

  generateRawNextBlock(blockData) {
    const previousBlock = this.getLatestBlock();
    const difficulty = this.getDifficulty(this.blockchain);
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = getCurrentTimestamp();
    const newBlock = this.findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
    if (this.addBlockToChain(newBlock)) {
      console.log(this.peerToPeer.broadcastLatest);
      this.peerToPeer.broadcastLatest();
      return newBlock;
    }
    return null;
  }

  // gets the unspent transaction outputs owned by the wallet
  getMyUnspentTransactionOutputs() {
    return findUnspentTxOuts(getPublicFromWallet(), this.getUnspentTxOuts());
  }

  generateNextBlock() {
    this.addTransaction(this.transactionPool.getTransactionPool());
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), this.getLatestBlock().index + 1);
    const blockData = [coinbaseTx].concat(this.transactionPool.getTransactionPool());
    return this.generateRawNextBlock(blockData);
  }

  generateNextBlockWithTransaction(receiverAddress, amount) {
    this.addTransaction(this.transactionPool.getTransactionPool());
    const txOut = new TxOut(receiverAddress, amount);
    if (!txOut.isValidAddress(receiverAddress)) {
      throw Error('invalid address');
    }
    if (typeof amount !== 'number') {
      throw Error('invalid amount');
    }
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), this.getLatestBlock().index + 1);
    const tx = createTransaction(receiverAddress, amount, getPrivateFromWallet(), this.getUnspentTxOuts(), this.transactionPool.getTransactionPool());
    const blockData = [coinbaseTx, tx];
    return this.generateRawNextBlock(blockData);
  }

  getAccountBalance() {
    return getBalance(getPublicFromWallet(), this.getUnspentTxOuts());
  }

  sendTransaction(address, amount) {
    const tx = createTransaction(address, amount, getPrivateFromWallet(), this.getUnspentTxOuts(), this.transactionPool.getTransactionPool());
    this.transactionPool.addToTransactionPool(tx, this.getUnspentTxOuts());
    this.peerToPeer.broadCastTransactionPool();
    return tx;
  }

  getAccumulatedDifficulty() {
    return (
      this.map((block) => block.difficulty)
        // eslint-disable-next-line no-restricted-properties
        .map((difficulty) => Math.pow(2, difficulty))
        .reduce((a, b) => a + b)
    );
  }

  /*
    Checks if the given blockchain is valid. Return the unspent txOuts if the chain is valid
 */
  isValidChain() {
    console.log('isValidChain:');
    console.log(JSON.stringify(this.blockchain));
    const isValidGenesis = (block) => JSON.stringify(block) === JSON.stringify(genesisBlock);

    if (!isValidGenesis(this.blockchain)) {
      return null;
    }
    /*
    Validate each block in the chain. The block is valid if the block structure is valid
      and the transaction are valid
     */
    let aUnspentTxOuts = [];

    for (let i = 0; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      if (i !== 0 && !this.isValidNewBlock(this.blockchain[i], this.blockchain[i - 1])) {
        return null;
      }

      aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
      if (aUnspentTxOuts === null) {
        console.log('invalid transactions in blockchain');
        return null;
      }
    }
    return aUnspentTxOuts;
  }

  replaceChain(newBlocks) {
    const aUnspentTxOuts = this.isValidChain(newBlocks);
    const validChain = aUnspentTxOuts !== null;
    if (validChain && this.getAccumulatedDifficulty(newBlocks) > this.getAccumulatedDifficulty(this.blockchain)) {
      console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
      this.blockchain = newBlocks;
      this.setUnspentTxOuts(aUnspentTxOuts);
      this.transactionPool.updateTransactionPool(this.unspentTxOuts);
      this.peerToPeer.broadcastLatest();
    } else {
      console.log('Received blockchain invalid');
    }
  }

  handleReceivedTransaction(transaction) {
    return this.transactionPool.addToTransactionPool(transaction, this.getUnspentTxOuts());
  }

  initP2PServer(port) {
    return this.peerToPeer.initP2PServer(port);
  }

  getSockets() {
    return this.peerToPeer.getSockets();
  }

  connectToPeers(newPeer) {
    return this.peerToPeer.connectToPeers(newPeer);
  }
}

module.exports = new BlockChain();
