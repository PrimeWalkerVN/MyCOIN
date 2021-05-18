import axiosClient from './axiosClient';
const blockchainApi = {
  getBlocks: () => {
    const url = '/blockchain/blocks';
    return axiosClient.get(url);
  },
  getBlockByHash: params => {
    const { hash } = params;
    const url = `/blockchain/block/${hash}`;
    return axiosClient.get(url);
  },
  getLatestBlock: () => {
    const url = `/blockchain/latest`;
    return axiosClient.get(url);
  },
  getTransaction: () => {
    const url = `/blockchain/transaction`;
    return axiosClient.get(url);
  },
  getTransactionById: params => {
    const { id } = params;
    const url = `/blockchain/transaction/${id}`;
    return axiosClient.get(url);
  },
  getTransactionByAddress: params => {
    const { address } = params;
    const url = `/blockchain/address/${address}`;
    return axiosClient.get(url);
  },
  getUnspentTransactionOutputs: () => {
    const url = `/blockchain/unspentTransactionOutputs`;
    return axiosClient.get(url);
  },
  getMyUnspentTransactionOutputs: () => {
    const url = `/blockchain/myUnspentTransactionOutputs`;
    return axiosClient.get(url);
  },
  mineTransaction: () => {
    const url = '/blockchain/mineTransaction';
    return axiosClient.post(url);
  },
  sendTransaction: params => {
    const url = '/blockchain/sendTransaction';
    return axiosClient.post(url, params);
  },
  getTransactionPool: () => {
    const url = '/blockchain/transactionPool';
    return axiosClient.get(url);
  },
  getPeers: () => {
    const url = '/blockchain/peers';
    return axiosClient.get(url);
  },
  addPeer: params => {
    const url = '/blockchain/addPeer';
    return axiosClient.post(url, params);
  },
  stopServer: () => {
    const url = '/blockchain/stop';
    return axiosClient.get(url);
  },

  mineBlock: () => {
    const url = `/blockchain/mineBlock`;
    return axiosClient.post(url);
  }
};

export default blockchainApi;
