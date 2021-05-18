import React, { useEffect, useState } from 'react';
import TransactionList from './components/TransactionList';
import blockchainApi from '../../api/blockchain';
const TransactionExplorer = () => {
  const [tx, setTx] = useState([]);

  const fetchData = async () => {
    try {
      const resLatest = await blockchainApi.getTransaction();
      setTx(resLatest.data);
    } catch (err) {}
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="row-span-4 p-5">
      <TransactionList data={tx} />
    </div>
  );
};

export default TransactionExplorer;
