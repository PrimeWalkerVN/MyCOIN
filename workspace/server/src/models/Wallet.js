const { ec } = require('elliptic');
const { existsSync, readFileSync, unlinkSync, writeFileSync } = require('fs');
const _ = require('lodash');
const { getPublicKey, signTxIn, Transaction } = require('./Transaction/Transaction');
const TxIn = require('./Transaction/TxIn');
const TxOut = require('./Transaction/TxOut');

const EC = new ec('secp256k1');
const privateKeyLocation = process.env.PRIVATE_KEY || `${__dirname}/private_key${process.env.PORT}.txt`;
const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

const getPrivateFromWallet = () => {
  const buffer = readFileSync(privateKeyLocation, 'utf8');
  return buffer.toString();
};

const getPublicFromWallet = () => {
  const privateKey = getPrivateFromWallet();
  const key = EC.keyFromPrivate(privateKey, 'hex');
  return key.getPublic().encode('hex');
};

const generatePrivateKey = () => {
  const keyPair = EC.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
};

const initWallet = () => {
  // let's not override existing private keys

  if (existsSync(privateKeyLocation)) {
    return;
  }
  const newPrivateKey = generatePrivateKey();
  console.log(newPrivateKey);

  writeFileSync(privateKeyLocation, newPrivateKey);
  console.log('new wallet with private key created to : %s', privateKeyLocation);
};

const deleteWallet = () => {
  if (existsSync(privateKeyLocation)) {
    unlinkSync(privateKeyLocation);
  }
};

const createWallet = (privateKey) => {
  if (existsSync(privateKeyLocation)) {
    throw Error('Private key already exist');
  } else {
    return writeFileSync(privateKeyLocation, privateKey);
  }
};
const findUnspentTxOuts = (ownerAddress, unspentTxOuts) => _.filter(unspentTxOuts, (uTxO) => uTxO.address === ownerAddress);
const getBalance = (address, unspentTxOuts) =>
  _(findUnspentTxOuts(address, unspentTxOuts))
    .map((uTxO) => uTxO.amount)
    .sum();

const findTxOutsForAmount = (amount, myUnspentTxOuts) => {
  console.log(myUnspentTxOuts);
  let currentAmount = 0;
  const includedUnspentTxOuts = [];
  for (const myUnspentTxOut of myUnspentTxOuts) {
    includedUnspentTxOuts.push(myUnspentTxOut);
    currentAmount += myUnspentTxOut.amount;
    if (currentAmount >= amount) {
      const leftOverAmount = currentAmount - amount;
      return { includedUnspentTxOuts, leftOverAmount };
    }
  }

  // const eMsg = `${'Cannot create transaction from the available unspent transaction outputs. Required amount:'}
  // ${amount}. Available unspentTxOuts:${JSON.stringify(myUnspentTxOuts)}`;
  throw Error('You do not have enough coin');
};

const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
  const txOut1 = new TxOut(receiverAddress, amount);
  if (leftOverAmount === 0) {
    return [txOut1];
  }
  const leftOverTx = new TxOut(myAddress, leftOverAmount);
  return [txOut1, leftOverTx];
};

const filterTxPoolTxs = (unspentTxOuts, transactionPool) => {
  const txIns = _(transactionPool)
    .map((tx) => tx.txIns)
    .flatten()
    .value();
  const removable = [];
  for (const unspentTxOut of unspentTxOuts) {
    const txIn = _.find(txIns, (aTxIn) => aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId);

    if (txIn === undefined) {
      console.log('Empty transaction input');
    } else {
      removable.push(unspentTxOut);
    }
  }

  return _.without(unspentTxOuts, ...removable);
};

const createTransaction = (receiverAddress, amount, privateKey, unspentTxOuts, txPool) => {
  console.log('txPool: %s', JSON.stringify(txPool));
  const myAddress = getPublicKey(privateKey);
  const myUnspentTxOutsA = unspentTxOuts.filter((uTxO) => uTxO.address === myAddress);

  const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);

  // filter from unspentOutputs such inputs that are referenced in pool
  const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, myUnspentTxOuts);

  const toUnsignedTxIn = (unspentTxOut) => {
    const txIn = new TxIn();
    txIn.txOutId = unspentTxOut.txOutId;
    txIn.txOutIndex = unspentTxOut.txOutIndex;
    txIn.from = myAddress;
    txIn.to = receiverAddress;
    txIn.amount = amount;
    txIn.timestamp = getCurrentTimestamp();

    return txIn;
  };

  const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);

  const tx = new Transaction(unsignedTxIns, createTxOuts(receiverAddress, myAddress, amount, leftOverAmount));

  tx.txIns = tx.txIns.map((txIn, index) => {
    txIn.signature = signTxIn(tx, index, privateKey, unspentTxOuts);
    return txIn;
  });

  return tx;
};

module.exports = {
  createTransaction,
  getPublicFromWallet,
  getPrivateFromWallet,
  getBalance,
  generatePrivateKey,
  initWallet,
  deleteWallet,
  createWallet,
  findUnspentTxOuts
};
