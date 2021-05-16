const SHA256 = require('crypto-js/sha256');

class Block {
  constructor(index, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return SHA256(this.index + this.previousHash + this.timestamp + this.data + this.difficulty + this.nonce).toString();
  }
}

module.exports = Block;
