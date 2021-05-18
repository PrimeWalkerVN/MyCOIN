import React, { useEffect, useState } from 'react';
import blockchainApi from '../../api/blockchain';
import TransactionPoolList from './components/TransactionPoolList';

const TransactionPool = () => {
  const [txPool, setTxPool] = useState([]);

  const fetchData = async () => {
    try {
      const resLatest = await blockchainApi.getTransactionPool();
      setTxPool(resLatest);
    } catch (err) {}
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="row-span-4 p-5">
      <TransactionPoolList data={txPool} />
    </div>
  );
};

export default TransactionPool;
