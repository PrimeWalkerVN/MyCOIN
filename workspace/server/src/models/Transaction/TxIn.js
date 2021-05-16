class TxIn {
  constructor(txOutId, txOutIndex, signature) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.signature = signature;
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
