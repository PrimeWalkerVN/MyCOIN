const Block = require("./Block")

class BlockChain {
    constructor() {
        this.blockchain = [this.]
    }

    createGenesisBlock() {
        return new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1620227165,[],0,0)
    }
}