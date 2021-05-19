const ecdsa = require('elliptic');
const _ = require('lodash');
const SHA256 = require('crypto-js/sha256');
const TxIn = require('./TxIn');
const TxOut = require('./TxOut');
const UnspentTxOut = require('./UnspentTxOut');

const ec = new ecdsa.ec('secp256k1');
const COINBASE_AMOUNT = 50;

const toHexString = (byteArray) => Array.from(byteArray, (byte) => `0${(byte & 0xff).toString(16)}`.slice(-2)).join('');

const getPublicKey = (aPrivateKey) => ec.keyFromPrivate(aPrivateKey, 'hex').getPublic().encode('hex');

const findUnspentTxOut = (transactionId, index, aUnspentTxOuts) =>
  aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);

const getTxInAmount = (txIn, aUnspentTxOuts) => findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;

// Boolean
const validateCoinbaseTx = (transaction, blockIndex) => {
  const getTransactionId = (tx) => {
    const txInContent = tx.txIns.map((txIn) => txIn.txOutId + txIn.txOutIndex).reduce((a, b) => a + b, '');
    const txOutContent = tx.txOuts.map((txOut) => txOut.address + txOut.amount).reduce((a, b) => a + b, '');
    return SHA256(txInContent + txOutContent).toString();
  };
  if (transaction == null) {
    console.log('the first transaction in the block must be coinbase transaction');
    return false;
  }
  if (getTransactionId(transaction) !== transaction.id) {
    console.log(`invalid coinbase tx id: ${transaction.id}`);
    return false;
  }
  if (transaction.txIns.length !== 1) {
    console.log('one txIn must be specified in the coinbase transaction');
    return false;
  }
  if (transaction.txIns[0].txOutIndex !== blockIndex) {
    console.log('the txIn signature in coinbase tx must be the block height');
    return false;
  }
  if (transaction.txOuts.length !== 1) {
    console.log('invalid number of txOuts in coinbase transaction');
    return false;
  }
  if (transaction.txOuts[0].amount !== COINBASE_AMOUNT) {
    console.log('invalid coinbase amount in coinbase transaction');
    return false;
  }
  return true;
};

// Boolean - check duplicate in transaction inputs
const hasDuplicates = (txIns) => {
  const groups = _.countBy(txIns, (txIn) => txIn.txOutId + txIn.txOutIndex);
  return _(groups)
    .map((value, key) => {
      if (value > 1) {
        console.log(`duplicate txIn: ${key}`);
        return true;
      }
      return false;
    })
    .includes(true);
};

// Boolean
const validateBlockTransactions = (aTransactions, aUnspentTxOuts, blockIndex) => {
  const coinbaseTx = aTransactions[0];
  if (!validateCoinbaseTx(coinbaseTx, blockIndex)) {
    console.log(`invalid coinbase transaction: ${JSON.stringify(coinbaseTx)}`);
    return false;
  }

  // check for duplicate txIns. Each txIn can be included only once
  const txIns = _(aTransactions)
    .map((tx) => tx.txIns)
    .flatten()
    .value();

  if (hasDuplicates(txIns)) {
    return false;
  }

  // all but coinbase transactions
  const normalTransactions = aTransactions.slice(1);
  return normalTransactions.map((tx) => tx.validateTransaction(aUnspentTxOuts)).reduce((a, b) => a && b, true);
};

const signTxIn = (transaction, txInIndex, privateKey, aUnspentTxOuts) => {
  const txIn = transaction.txIns[txInIndex];
  const dataToSign = transaction.id;
  const referencedUnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);
  if (referencedUnspentTxOut == null) {
    console.log('could not find referenced txOut');
    throw Error();
  }
  const referencedAddress = referencedUnspentTxOut.address;

  if (getPublicKey(privateKey) !== referencedAddress) {
    console.log('trying to sign an input with private key that does not match the address that is referenced in txIn');
    throw Error();
  }
  const key = ec.keyFromPrivate(privateKey, 'hex');
  const signature = toHexString(key.sign(dataToSign).toDER());

  return signature;
};

const updateUnspentTxOuts = (aTransactions, aUnspentTxOuts) => {
  const newUnspentTxOuts = aTransactions
    .map((t) => t.txOuts.map((txOut, index) => new UnspentTxOut(t.id, index, txOut.address, txOut.amount)))
    .reduce((a, b) => a.concat(b), []);

  const consumedTxOuts = aTransactions
    .map((t) => t.txIns)
    .reduce((a, b) => a.concat(b), [])
    .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0));

  const resultingUnspentTxOuts = aUnspentTxOuts
    .filter((uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts))
    .concat(newUnspentTxOuts);

  return resultingUnspentTxOuts;
};

class Transaction {
  constructor(txIns, txOuts) {
    this.txIns = txIns;
    this.txOuts = txOuts;
    this.id = this.getTransactionId();
  }

  getTransactionId() {
    const txInContent = this.txIns.map((txIn) => txIn.txOutId + txIn.txOutIndex).reduce((a, b) => a + b, '');
    const txOutContent = this.txOuts.map((txOut) => txOut.address + txOut.amount).reduce((a, b) => a + b, '');
    return SHA256(txInContent + txOutContent).toString();
  }

  isValidTransactionStructure() {
    if (typeof this.id !== 'string') {
      console.log('transactionId missing');
      return false;
    }
    if (!(this.txIns instanceof Array)) {
      console.log('invalid txIns type in transaction');
      return false;
    }
    if (!this.txIns.map((txIn) => txIn.isValidTxInStructure()).reduce((a, b) => a && b, true)) {
      return false;
    }

    if (!(this.txOuts instanceof Array)) {
      console.log('invalid txIns type in transaction');
      return false;
    }

    if (!this.txOuts.map((txOut) => txOut.isValidTxOutStructure()).reduce((a, b) => a && b, true)) {
      return false;
    }
    return true;
  }

  validateTxIn(txIn, transaction, aUnspentTxOuts) {
    const referencedUTxOut = aUnspentTxOuts.find((uTxO) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
    if (referencedUTxOut == null) {
      console.log(`referenced txOut not found: ${JSON.stringify(txIn)}`);
      return false;
    }
    const { address } = referencedUTxOut;

    const key = ec.keyFromPublic(address, 'hex');
    const validSignature = key.verify(transaction.id, txIn.signature);
    if (!validSignature) {
      console.log('invalid txIn signature: %s txId: %s address: %s', txIn.signature, transaction.id, referencedUTxOut.address);
      return false;
    }
    return true;
  }

  // Boolean
  validateTransaction(aUnspentTxOuts) {
    if (!this.isValidTransactionStructure()) {
      return false;
    }

    if (this.getTransactionId() !== this.id) {
      console.log(`invalid tx id: ${this.id}`);
      return false;
    }
    const hasValidTxIns = this.txIns.map((txIn) => this.validateTxIn(txIn, this, aUnspentTxOuts)).reduce((a, b) => a && b, true);

    if (!hasValidTxIns) {
      console.log(`some of the txIns are invalid in tx: ${this.id}`);
      return false;
    }

    const totalTxInValues = this.txIns.map((txIn) => getTxInAmount(txIn, aUnspentTxOuts)).reduce((a, b) => a + b, 0);

    const totalTxOutValues = this.txOuts.map((txOut) => txOut.amount).reduce((a, b) => a + b, 0);

    if (totalTxOutValues !== totalTxInValues) {
      console.log(`totalTxOutValues !== totalTxInValues in tx: ${this.id}`);
      return false;
    }

    return true;
  }
}
const processTransactions = (aTransactions, aUnspentTxOuts, blockIndex) => {
  const txs = aTransactions.map((tx) => {
    const txIns = tx.txIns.map((txIn) => new TxIn(txIn.txOutId, txIn.txOutIndex, txIn.signature, txIn.from, txIn.to, txIn.amount, txIn.timestamp));
    const txOuts = tx.txOuts.map((txOut) => new TxOut(txOut.address, txOut.amount));
    return new Transaction(txIns, txOuts);
  });
  if (!validateBlockTransactions(txs, aUnspentTxOuts, blockIndex)) {
    console.log('invalid block transactions');
    return null;
  }
  return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
};
const getCoinbaseTransaction = (address, blockIndex) => {
  const txIn = new TxIn('', blockIndex, '', '', '', 0);
  const t = new Transaction([txIn], [new TxOut(address, COINBASE_AMOUNT)]);
  return t;
};

module.exports = { Transaction, getCoinbaseTransaction, getPublicKey, hasDuplicates, processTransactions, signTxIn };
