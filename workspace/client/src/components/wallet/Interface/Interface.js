import React, { useEffect, useState } from 'react';
import { Link, Redirect, Route, Switch, useHistory } from 'react-router-dom';
import Address from '../../core/Address';
import Balance from '../../core/Balance';
import NetWork from '../../core/NetWork';
import DashBoard from './DashBoard';
import { get, isEmpty } from 'lodash';
import walletApi from '../../../api/wallet';
import blockchainApi from '../../../api/blockchain';
const SendTransaction = React.lazy(() => import('./SendTransaction'));

const Interface = props => {
  const history = useHistory();
  const privateKey = get(props, 'location.state.privateKey', '');
  if (isEmpty(privateKey)) history.replace('/intro');

  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [latestBlock, setLatestBlock] = useState({});
  const [myTxOuts, setMyTxOuts] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [loading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const resAddress = walletApi.getAddress();
      const resBalance = walletApi.getBalance();
      const resLatest = blockchainApi.getLatestBlock();
      const resMyTxOuts = blockchainApi.getMyUnspentTransactionOutputs();
      Promise.all([resAddress, resBalance, resLatest, resMyTxOuts]).then(values => {
        setAddress(values[0].address);
        setBalance(values[1].balance);
        setLatestBlock(values[2].data);
        setMyTxOuts(values[3]);
      });
    } catch (err) {}
  };

  const mineBlock = async () => {
    setIsLoading(true);
    await blockchainApi.mineBlock();
    setRefetch(!refetch);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [refetch]);

  return (
    <div className="w-full h-screen grid grid-cols-6 gap-3 bg-gray-200">
      <div className="flex flex-col col-span-1 bg-white mt-3">
        <Link
          to={{
            pathname: '/wallet/dashboard',
            state: { privateKey: privateKey }
          }}
          className="text-xl font-bold text-blue-700 my-5 hover:bg-gray-200 text-center cursor-pointer"
        >
          DashBoard
        </Link>
        <Link
          to={{
            pathname: '/wallet/send-transaction',
            state: { privateKey: privateKey }
          }}
          className="text-xl font-bold text-red-700 my-5 hover:bg-gray-200 text-center cursor-pointer"
        >
          SendTransaction
        </Link>
        <Link to="/intro" className="text-xl font-bold text-gray-700 my-5 hover:bg-gray-200 text-center cursor-pointer">
          Logout
        </Link>
      </div>
      <div className="grid grid-rows-5 col-span-5 gap-3 bg-white mt-3 p-5">
        <div className="row-span-1 grid grid-cols-3 gap-3">
          <Address value={address} />
          <Balance value={balance} />
          <NetWork value={latestBlock.index} />
        </div>
        <div className="row-span-4">
          <Switch>
            <Route path="/wallet/dashboard" component={() => <DashBoard data={myTxOuts} loading={loading} onMine={mineBlock} />} />
            <Route path="/wallet/send-transaction" component={SendTransaction} />
            <Redirect from="/wallet" to="wallet/dashboard" />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Interface;
