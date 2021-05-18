import React from 'react';
import AddressIcon from '../../assets/address.png';
const Address = props => {
  const { value } = props;
  return (
    <div className="bg-indigo-400 grid grid-cols-4 gap-5 rounded-sm">
      <div className="flex justify-center items-center col-span-1">
        <img className="rounded-full w-20 h-20 border-white border-4" src={AddressIcon} alt="Address" />
      </div>
      <div className="flex flex-col col-span-3 py-5 justify-between pr-4">
        <p className="w-full text-2xl text-white font-bold">Address</p>
        <p className="w-full break-words mt-5 text-white text-base">{value}</p>
      </div>
    </div>
  );
};

export default Address;
