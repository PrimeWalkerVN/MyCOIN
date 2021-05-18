import React, { useEffect, useState } from 'react';
import blockchainApi from '../../api/blockchain';
import Difficulty from '../core/Difficulty';
import LastBlock from '../core/LastBlock';
import Nonce from '../core/Nonce';
import BlockList from './components/BlockList';

const BlockExplorer = () => {
  const [blocks, setBlocks] = useState([]);
  const [latestBlock, setLatestBlock] = useState({});

  const fetchData = async () => {
    try {
      const resLatest = blockchainApi.getLatestBlock();
      const resBlocks = blockchainApi.getBlocks();
      Promise.all([resLatest, resBlocks]).then(values => {
        setLatestBlock(values[0].data);

        setBlocks(values[1].sort((a, b) => b.timestamp - a.timestamp));
      });
    } catch (err) {}
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="grid grid-rows-5 gap-2 h-screen">
      <div className="row-span-1 grid grid-cols-3 gap-2">
        <LastBlock value={latestBlock.index} />
        <Nonce value={latestBlock.nonce} />
        <Difficulty value={latestBlock.difficulty} />
      </div>
      <div className="row-span-4 p-5">
        <BlockList data={blocks} />
      </div>
    </div>
  );
};

export default BlockExplorer;
