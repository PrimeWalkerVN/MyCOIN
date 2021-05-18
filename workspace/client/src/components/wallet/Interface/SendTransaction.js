import React, { useState } from 'react';
import { isNaN } from 'lodash';
import blockchainApi from '../../../api/blockchain';

const SendTransaction = () => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (typeof address !== 'string' || isNaN(amount)) {
      setError('Address must be character and amount must be number');
      return;
    }
    if (address === '' || amount <= 0) {
      setError('Invalid field! Address must be character and amount must be number');
      return;
    }
    const params = {
      address: address,
      amount: amount
    };

    try {
      setIsLoading(true);
      await blockchainApi.sendTransaction(params);
      setIsSuccess(true);
      setError('');
    } catch (error) {
      setError(error.response.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5 p-10">
      <div className="text-2xl font-bold my-2 text-indigo-800">Send Transaction {isSuccess.toString()}</div>

      <div className="p-5">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="address">
            To address
          </label>
          <input
            class="shadow appearance-none border border-gray-400 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="address"
            type="text"
            value={address}
            onChange={({ target }) => setAddress(target.value)}
            placeholder="Address"
          />
        </div>
        <div class="w-full">
          <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-zip">
            Amount
          </label>
          <input
            class="appearance-none block w-full shadow text-gray-700 border border-gray-400 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            id="amount"
            onChange={({ target }) => setAmount(target.value)}
            type="number"
            value={amount}
            placeholder="10"
          />
        </div>
        <div className="w-full flex flex-col items-center mt-10">
          {error.length > 0 && <div className="text-base text-red-500 mb-5">Error: {error}</div>}
          <button
            type="button"
            onClick={onSubmit}
            class="py-2 px-4 w-1/5 flex justify-center items-center  bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg "
          >
            {isLoading && (
              <svg width="40" height="40" fill="currentColor" class="mr-2 animate-spin" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                <path d="M526 1394q0 53-37.5 90.5t-90.5 37.5q-52 0-90-38t-38-90q0-53 37.5-90.5t90.5-37.5 90.5 37.5 37.5 90.5zm498 206q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm-704-704q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm1202 498q0 52-38 90t-90 38q-53 0-90.5-37.5t-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm-964-996q0 66-47 113t-113 47-113-47-47-113 47-113 113-47 113 47 47 113zm1170 498q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm-640-704q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm530 206q0 93-66 158.5t-158 65.5q-93 0-158.5-65.5t-65.5-158.5q0-92 65.5-158t158.5-66q92 0 158 66t66 158z"></path>
              </svg>
            )}
            Send
          </button>
          {isSuccess && <div className="text-2xl font-bold mt-5 text-green-400">Success! Your transaction already in the pool</div>}
        </div>
      </div>
    </div>
  );
};

export default SendTransaction;
