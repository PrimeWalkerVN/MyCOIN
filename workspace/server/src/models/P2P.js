const WebSocket = require('ws');
const { Server } = require('ws');
const BlockChain = require('../database/BlockchainDB');

const MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  QUERY_TRANSACTION_POOL: 3,
  RESPONSE_TRANSACTION_POOL: 4
};

class Message {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}
class PeerToPeer {
  constructor(webSockets) {
    this.sockets = webSockets;
  }

  getSockets = () => this.sockets;

  JSONToObject = (data) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  initP2PServer = (p2pPort) => {
    const server = new WebSocket.Server({ port: p2pPort });
    server.on('connection', (ws) => {
      this.initConnection(ws);
    });
    console.log('listening websocket p2p port on: ' + p2pPort);
  };

  initConnection = (ws) => {
    this.sockets.push(ws);
    this.initMessageHandler(ws);
    this.initErrorHandler(ws);
    this.write(ws, this.queryChainLengthMsg());

    // query transactions pool only some time after chain query
    setTimeout(() => {
      this.broadcast(this.queryTransactionPoolMsg());
    }, 500);
  };

  initMessageHandler = (ws) => {
    ws.on('message', (data) => {
      try {
        const message = JSONToObject(data);
        if (message === null) {
          console.log('could not parse received JSON message: ' + data);
          return;
        }
        console.log('Received message: %s', JSON.stringify(message));
        switch (message.type) {
          case MessageType.QUERY_LATEST:
            this.write(ws, this.responseLatestMsg());
            break;
          case MessageType.QUERY_ALL:
            this.write(ws, this.responseChainMsg());
            break;
          case MessageType.RESPONSE_BLOCKCHAIN:
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
            const receivedTransactions = JSONToObject(message.data);
            if (receivedTransactions === null) {
              console.log('invalid transaction received: %s', JSON.stringify(message.data));
              break;
            }
            receivedTransactions.forEach((transaction) => {
              try {
                this.handleReceivedTransaction(transaction);
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
  };

  write = (ws, message) => ws.send(JSON.stringify(message));
  broadcast = (message) => sockets.forEach((socket) => this.write(socket, message));

  queryChainLengthMsg = () => ({ type: MessageType.QUERY_LATEST, data: null });

  queryAllMsg = () => ({ type: MessageType.QUERY_ALL, data: null });

  responseChainMsg = () => ({
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(BlockChain.getBlockchain())
  });
}
