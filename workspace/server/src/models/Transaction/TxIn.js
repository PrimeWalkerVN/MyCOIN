class TxIn {
  constructor(txOutId, txOutIndex, signature, from, to, amount, timestamp) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.signature = signature;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
  }

  isValidTxInStructure() {
    if (this == null) {
      console.log('txIn is null');
      return false;
    }
    if (typeof this.signature !== 'string') {
      console.log('invalid signature type in txIn');
      return false;
    }
    if (typeof this.txOutId !== 'string') {
      console.log('invalid txOutId type in txIn');
      return false;
    }
    if (typeof this.txOutIndex !== 'number') {
      console.log('invalid txOutIndex type in txIn');
      return false;
    }
    return true;
  }
}
module.exports = TxIn;
