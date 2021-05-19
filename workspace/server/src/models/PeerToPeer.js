const WebSocket = require('ws');
const { Transaction } = require('./Transaction/Transaction');
const TxIn = require('./Transaction/TxIn');
const TxOut = require('./Transaction/TxOut');

const MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  QUERY_TRANSACTION_POOL: 3,
  RESPONSE_TRANSACTION_POOL: 4
};
const JSONToObject = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return null;
  }
};
class PeerToPeer {
  constructor(blockchain) {
    this.sockets = [];
    this.blockchain = blockchain;
  }

  getSockets() {
    return this.sockets;
  }

  write(ws, message) {
    return ws.send(JSON.stringify(message));
  }

  broadcast(message) {
    return this.sockets.forEach((socket) => this.write(socket, message));
  }

  queryChainLengthMsg() {
    return { type: MessageType.QUERY_LATEST, data: null };
  }

  queryAllMsg() {
    return { type: MessageType.QUERY_ALL, data: null };
  }

  responseChainMsg() {
    return { type: MessageType.RESPONSE_BLOCKCHAIN, data: JSON.stringify(this.blockchain.getBlockchain()) };
  }

  queryTransactionPoolMsg() {
    return { type: MessageType.QUERY_TRANSACTION_POOL, data: null };
  }

  responseLatestMsg() {
    return { type: MessageType.RESPONSE_BLOCKCHAIN, data: JSON.stringify([this.blockchain.getLatestBlock()]) };
  }

  responseTransactionPoolMsg() {
    return {
      type: MessageType.RESPONSE_TRANSACTION_POOL,
      data: JSON.stringify(this.blockchain.getTransactionPool())
    };
  }

  handleBlockchainResponse(receivedBlocks) {
    if (receivedBlocks.length === 0) {
      console.log('received block chain size of 0');
      return;
    }

    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    if (!this.blockchain.isValidBlockStructure(latestBlockReceived)) {
      console.log('block structuture not valid');
      return;
    }
    const latestBlockHeld = this.blockchain.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
      console.log(`blockchain possibly behind. We got: ${latestBlockHeld.index} Peer got: ${latestBlockReceived.index}`);
      if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
        if (this.blockchain.addBlockToChain(latestBlockReceived)) {
          this.broadcast(this.responseLatestMsg());
        }
      } else if (receivedBlocks.length === 1) {
        console.log('We have to query the chain from our peer');
        this.broadcast(this.queryAllMsg());
      } else {
        console.log('Received blockchain is longer than current blockchain');
        this.blockchain.replaceChain(receivedBlocks);
      }
    } else {
      console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
  }

  initErrorHandler(ws) {
    const closeConnection = (myWs) => {
      console.log(`connection failed to peer: ${myWs.url}`);
      this.sockets.splice(this.sockets.indexOf(myWs), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
  }

  broadCastTransactionPool() {
    return this.broadcast(this.responseTransactionPoolMsg());
  }

  initMessageHandler(ws) {
    ws.on('message', (data) => {
      try {
        const message = JSONToObject(data);
        if (message === null) {
          console.log(`could not parse received JSON message: ${data}`);
          return;
        }
        console.log('Received message: %s', JSON.stringify(message));
        // eslint-disable-next-line default-case
        switch (message.type) {
          case MessageType.QUERY_LATEST:
            console.log('=========lasted');
            this.write(ws, this.responseLatestMsg());
            break;
          case MessageType.QUERY_ALL:
            this.write(ws, this.responseChainMsg());
            break;
          case MessageType.RESPONSE_BLOCKCHAIN:
            // eslint-disable-next-line no-case-declarations
            const receivedBlocks = JSONToObject(message.data);
            if (receivedBlocks === null) {
              console.log('invalid blocks received: %s', JSON.stringify(message.data));
              break;
            }
            this.handleBlockchainResponse(receivedBlocks);
            break;
          case MessageType.QUERY_TRANSACTION_POOL:
            this.write(ws, this.responseTransactionPoolMsg());
            break;
          case MessageType.RESPONSE_TRANSACTION_POOL:
            // eslint-disable-next-line no-case-declarations
            const receivedTransactions = JSONToObject(message.data);
            if (receivedTransactions === null) {
              console.log('invalid transaction received: %s', JSON.stringify(message.data));
              break;
            }
            receivedTransactions.forEach((transaction) => {
              try {
                const txIns = transaction.txIns.map(
                  (txIn) => new TxIn(txIn.txOutId, txIn.txOutIndex, txIn.signature, txIn.from, txIn.to, txIn.amount, txIn.timestamp)
                );
                const txOuts = transaction.txOuts.map((txOut) => new TxOut(txOut.address, txOut.amount));

                const tx = new Transaction(txIns, txOuts);
                this.blockchain.handleReceivedTransaction(tx);
                // if no error is thrown, transaction was indeed added to the pool
                // let's broadcast transaction pool
                this.broadCastTransactionPool();
              } catch (e) {
                console.log(e.message);
              }
            });
            break;
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  initConnection(ws) {
    this.sockets.push(ws);
    this.initMessageHandler(ws);
    this.initErrorHandler(ws);
    this.write(ws, this.queryChainLengthMsg());

    // query transactions pool only some time after chain query
    setTimeout(() => {
      this.broadcast(this.queryTransactionPoolMsg());
    }, 500);
  }

  initP2PServer(p2pPort) {
    const server = new WebSocket.Server({ port: p2pPort });
    server.on('connection', (ws) => {
      this.initConnection(ws);
    });
    console.log(`listening websocket p2p port on: ${p2pPort}`);
  }

  broadcastLatest() {
    console.log('broadcast Latest!!!!!');
    this.broadcast(this.responseLatestMsg());
  }

  connectToPeers(newPeer) {
    const ws = new WebSocket(newPeer);
    ws.on('open', () => {
      this.initConnection(ws);
    });
    ws.on('error', () => {
      console.log('connection failed');
    });
  }
}

module.exports = PeerToPeer;
