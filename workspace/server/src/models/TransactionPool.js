const _ = require('lodash');

const hasTxIn = (txIn, unspentTxOuts) => {
  const foundTxIn = unspentTxOuts.find((uTxO) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
  return foundTxIn !== undefined;
};

class TransactionPool {
  constructor(transactions) {
    this.transactionPool = transactions;
  }

  getTransactionPool() {
    return _.cloneDeep(this.transactionPool);
  }

  addToTransactionPool(tx, unspentTxOuts) {
    if (!tx.validateTransaction(unspentTxOuts)) {
      throw Error('Transaction Invalid, please check again');
    }

    if (!this.isValidTxForPool(tx)) {
      throw Error('Transaction Invalid, please check again');
    }
    console.log('adding to txPool: %s', JSON.stringify(tx));
    this.transactionPool.push(tx);
  }

  updateTransactionPool(unspentTxOuts) {
    const invalidTxs = [];
    for (const tx of this.transactionPool) {
      for (const txIn of tx.txIns) {
        if (!hasTxIn(txIn, unspentTxOuts)) {
          invalidTxs.push(tx);
          break;
        }
      }
    }
    if (invalidTxs.length > 0) {
      console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidTxs));
      this.transactionPool = _.without(this.transactionPool, ...invalidTxs);
    }
  }

  getTxPoolIns() {
    return _(this.transactionPool)
      .map((tx) => tx.txIns)
      .flatten()
      .value();
  }

  isValidTxForPool(tx) {
    const txPoolIns = this.getTxPoolIns();

    const containsTxIn = (txIns, txIn) => _.find(txIns, (txPoolIn) => txIn.txOutIndex === txPoolIn.txOutIndex && txIn.txOutId === txPoolIn.txOutId);

    // eslint-disable-next-line no-restricted-syntax
    for (const txIn of tx.txIns) {
      if (containsTxIn(txPoolIns, txIn)) {
        console.log('txIn already found in the txPool');
        return false;
      }
    }
    return true;
  }
}

module.exports = TransactionPool;
