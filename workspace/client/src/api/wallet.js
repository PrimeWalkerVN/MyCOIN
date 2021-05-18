import axiosClient from './axiosClient';
const walletApi = {
  getBalance: () => {
    const url = `/wallet/balance`;
    return axiosClient.get(url);
  },
  getAddress: () => {
    const url = '/wallet/address';
    return axiosClient.get(url);
  },
  accessWallet: params => {
    const url = '/wallet/access';
    return axiosClient.post(url, params);
  },
  deleteWallet: () => {
    const url = '/wallet/delete';
    return axiosClient.post(url);
  }
};

export default walletApi;
