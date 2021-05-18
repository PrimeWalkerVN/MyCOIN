import React from 'react';
import NetworkIcon from '../../assets/network.svg';
const Network = () => {
  return (
    <div className=" bg-green-400 grid grid-cols-4 gap-5 rounded-sm">
      <div className="flex justify-center items-center col-span-1">
        <img className="border-white border-4 rounded-full object-scale-down w-20 h-20" src={NetworkIcon} alt="Network" />
      </div>
      <div className="flex flex-col col-span-3 py-5 justify-center">
        <p className="w-full text-2xl text-white font-bold">Network</p>
        <p className="w-full break-words mt-5 text-white text-xl">Last block#: 1900</p>
      </div>
    </div>
  );
};

export default Network;
