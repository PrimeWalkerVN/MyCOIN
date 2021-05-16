const Block = require('./Block');

class BlockChain {
  constructor() {
    this.blockchain = [this.createGenesisBlock()];
  }

  // get Blockchain

  getBlockchain = () => this.blockchain;

  // get latest block
  getLatestBlock = () => this.blockchain[this.blockchain.length - 1];

  // create genesis block
  createGenesisBlock = () => new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1620227165, [], 0, 0);

  // add new block
  generateNextBlock = (blockData) => {
    const previousBlock = this.getLatestBlock();
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = new Date().getTime() / 1000;
    const newBlock = new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    return newBlock;
  };

  isValidNewBlock = (newBlock) => {
    const previousBlock = this.getLatestBlock();
    if (previousBlock.index + 1 !== newBlock.index) {
      console.log('invalid index');
      return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
      console.log('invalid previoushash');
      return false;
    } else if (newBlock.calculateHash() !== newBlock.hash) {
      console.log(typeof newBlock.hash + ' ' + typeof newBlock.calculateHash());
      console.log('invalid hash: ' + newBlock.calculateHash() + ' ' + newBlock.hash);
      return false;
    }
    return true;
  };

  isValidBlockStructure = (block) => {
    return (
      typeof block.index === 'number' &&
      typeof block.hash === 'string' &&
      typeof block.previousHash === 'string' &&
      typeof block.timestamp === 'number' &&
      typeof block.data === 'string'
    );
  };

  isValidChain = (blockchainToValidate) => {
    const isValidGenesis = (block) => {
      return JSON.stringify(block) === JSON.stringify(this.createGenesisBlock());
    };

    if (!isValidGenesis(blockchainToValidate[0])) {
      return false;
    }

    for (let i = 1; i < blockchainToValidate.length; i++) {
      if (!this.isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
        return false;
      }
    }
    return true;
  };

  replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
      console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
      this.blockchain = newBlocks;
      broadcastLatest();
    } else {
      console.log('Received blockchain invalid');
    }
  };
}

module.exports = BlockChain;
