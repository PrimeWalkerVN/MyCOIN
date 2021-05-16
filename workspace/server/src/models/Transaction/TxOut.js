class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }

  // valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
  isValidAddress() {
    if (this.address.length !== 130) {
      console.log(this.address);
      console.log('invalid public key length');
      return false;
    }
    if (this.address.match('^[a-fA-F0-9]+$') === null) {
      console.log('public key must contain only hex characters');
      return false;
    }
    if (!this.address.startsWith('04')) {
      console.log('public key must start with 04');
      return false;
    }
    return true;
  }

  isValidTxOutStructure() {
    if (this == null) {
      console.log('txOut is null');
      return false;
    }
    if (typeof this.address !== 'string') {
      console.log('invalid address type in txOut');
      return false;
    }
    if (!this.isValidAddress()) {
      console.log('invalid TxOut address');
      return false;
    }
    if (typeof this.amount !== 'number') {
      console.log('invalid amount type in txOut');
      return false;
    }
    return true;
  }
}

module.exports = TxOut;
