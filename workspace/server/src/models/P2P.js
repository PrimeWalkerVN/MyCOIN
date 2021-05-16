const WebSocket = require('ws');
const {
  transactionPool,
  addBlockToChain,
  getBlockchain,
  getLatestBlock,
  handleReceivedTransaction,
  isValidBlockStructure,
  replaceChain
} = require('./BlockChain');

const sockets = [];

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

const getSockets = () => sockets;

const write = (ws, message) => ws.send(JSON.stringify(message));
const broadcast = (message) => sockets.forEach((socket) => write(socket, message));

const queryChainLengthMsg = () => ({ type: MessageType.QUERY_LATEST, data: null });

const queryAllMsg = () => ({ type: MessageType.QUERY_ALL, data: null });

const responseChainMsg = () => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify(getBlockchain())
});

const responseLatestMsg = () => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify([getLatestBlock()])
});

const queryTransactionPoolMsg = () => ({
  type: MessageType.QUERY_TRANSACTION_POOL,
  data: null
});

const responseTransactionPoolMsg = () => ({
  type: MessageType.RESPONSE_TRANSACTION_POOL,
  data: JSON.stringify(transactionPool.getTransactionPool())
});

const handleBlockchainResponse = (receivedBlocks) => {
  if (receivedBlocks.length === 0) {
    console.log('received block chain size of 0');
    return;
  }
  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  if (!isValidBlockStructure(latestBlockReceived)) {
    console.log('block structuture not valid');
    return;
  }
  const latestBlockHeld = getLatestBlock();
  if (latestBlockReceived.index > latestBlockHeld.index) {
    console.log(`blockchain possibly behind. We got: ${latestBlockHeld.index} Peer got: ${latestBlockReceived.index}`);
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      if (addBlockToChain(latestBlockReceived)) {
        broadcast(responseLatestMsg());
      }
    } else if (receivedBlocks.length === 1) {
      console.log('We have to query the chain from our peer');
      broadcast(queryAllMsg());
    } else {
      console.log('Received blockchain is longer than current blockchain');
      replaceChain(receivedBlocks);
    }
  } else {
    console.log('received blockchain is not longer than received blockchain. Do nothing');
  }
};

const initErrorHandler = (ws) => {
  const closeConnection = (myWs) => {
    console.log(`connection failed to peer: ${myWs.url}`);
    sockets.splice(sockets.indexOf(myWs), 1);
  };
  ws.on('close', () => closeConnection(ws));
  ws.on('error', () => closeConnection(ws));
};

const broadCastTransactionPool = () => {
  broadcast(responseTransactionPoolMsg());
};

const initMessageHandler = (ws) => {
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
          write(ws, responseLatestMsg());
          break;
        case MessageType.QUERY_ALL:
          write(ws, responseChainMsg());
          break;
        case MessageType.RESPONSE_BLOCKCHAIN:
          // eslint-disable-next-line no-case-declarations
          const receivedBlocks = JSONToObject(message.data);
          if (receivedBlocks === null) {
            console.log('invalid blocks received: %s', JSON.stringify(message.data));
            break;
          }
          handleBlockchainResponse(receivedBlocks);
          break;
        case MessageType.QUERY_TRANSACTION_POOL:
          write(ws, responseTransactionPoolMsg());
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
              handleReceivedTransaction(transaction);
              // if no error is thrown, transaction was indeed added to the pool
              // let's broadcast transaction pool
              broadCastTransactionPool();
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

const initConnection = (ws) => {
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  write(ws, queryChainLengthMsg());

  // query transactions pool only some time after chain query
  setTimeout(() => {
    broadcast(queryTransactionPoolMsg());
  }, 500);
};

const initP2PServer = (p2pPort) => {
  const server = new WebSocket.Server({ port: p2pPort });
  server.on('connection', (ws) => {
    initConnection(ws);
  });
  console.log(`listening websocket p2p port on: ${p2pPort}`);
};

const broadcastLatest = () => {
  broadcast(responseLatestMsg());
};

const connectToPeers = (newPeer) => {
  const ws = new WebSocket(newPeer);
  ws.on('open', () => {
    initConnection(ws);
  });
  ws.on('error', () => {
    console.log('connection failed');
  });
};

module.exports = { connectToPeers, broadcastLatest, broadCastTransactionPool, initP2PServer, getSockets };
