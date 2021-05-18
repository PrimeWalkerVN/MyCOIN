import React from 'react';

const Transaction = props => {
  const { address, amount, id } = props;
  return (
    <div className="bg-gray-200 my-4 p-4">
      <div className="flex">
        <p className="text-lg font-bold">ID Hash: </p>
        <span className="text-base ml-5">
          dskfjaklsjdf;ljasd;lfja;sldkfj;sladkjf;dlsakjf;dslkjf;lskdajflksdjfl;kdsja;flkjsad;fljs;adklfjsd;alfj;lkj
        </span>
      </div>
      <div className="flex">
        <p className="text-lg font-bold">Amount: </p>
        <span className="text-base ml-5">50 PWC</span>
      </div>
      <div className="flex">
        <p className="text-lg font-bold">Address: </p>
        <span className="text-base ml-5">
          ID Hash:dskfjaklsjdf;ljasd;lfja;sldkfj;sladkjf;dlsakjf;dslkjf;lskdajflksdjfl;kdsja;flkjsad;fljs;adklfjsd;alfj;lkj
        </span>
      </div>
    </div>
  );
};

export default Transaction;
