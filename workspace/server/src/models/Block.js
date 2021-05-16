const SHA256 = require('crypto-js/sha256');

class Block {
    constructor(index, hash, previousHash,
        timestamp, data, difficulty, nonce) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
    calculateHash(){
        return SHA256(this.index + this.previousHash + this.timestamp + this.data + this.difficulty + this.nonce).toString()
    }
    
}

module.exports = Block
