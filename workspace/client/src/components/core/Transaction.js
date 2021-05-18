import React from 'react';

const Transaction = props => {
  const { item = {}, index = 0 } = props;
  const { txOutId = 0, address = '', amount = 0 } = item;
  return (
    <div className="bg-gray-200 my-4 p-4">
      <div className="grid grid-rows-4 gap-3 h-48">
        <div className="grid grid-cols-7">
          <p className="text-lg font-bold w-24 col-span-1">Index: </p>
          <span className="text-base col-span-6">{index}</span>
        </div>
        <div className="grid grid-cols-7">
          <p className="text-lg font-bold w-24 col-span-1">Output ID: </p>
          <span className="text-base col-span-6">{txOutId}</span>
        </div>
        <div className="grid grid-cols-7">
          <p className="text-lg font-bold w-24 col-span-1">Amount: </p>
          <span className="text-base  col-span-6">{amount} PWC</span>
        </div>
        <div className="grid grid-cols-7">
          <p className="text-lg font-bold w-24 col-span-1">Address: </p>
          <span className="text-base col-span-6 break-words">{address}</span>
        </div>
      </div>
    </div>
  );
};

export default Transaction;
