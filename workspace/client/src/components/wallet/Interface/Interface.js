import React from 'react';
import { Link, Redirect, Route, Switch } from 'react-router-dom';
import Address from '../../core/Address';
import Balance from '../../core/Balance';
import NetWork from '../../core/NetWork';
import DashBoard from './DashBoard';
import SendTransaction from './SendTransaction';

const Interface = () => {
  return (
    <div className="w-full h-screen grid grid-cols-6 gap-3 bg-gray-200">
      <div className="flex flex-col col-span-1 bg-white mt-3">
        <Link to="/wallet/dashboard" className="text-xl font-bold text-blue-700 my-5 hover:bg-gray-200 text-center cursor-pointer">
          DashBoard
        </Link>
        <Link to="/wallet/send-transaction" className="text-xl font-bold text-red-700 my-5 hover:bg-gray-200 text-center cursor-pointer">
          SendTransaction
        </Link>
        <p to="/wallet/send-transaction" className="text-xl font-bold text-gray-700 my-5 hover:bg-gray-200 text-center cursor-pointer">
          Logout
        </p>
      </div>
      <div className="grid grid-rows-5 col-span-5 gap-3 bg-white mt-3 p-5">
        <div className="row-span-1 grid grid-cols-3 gap-3">
          <Address />
          <Balance />
          <NetWork />
        </div>
        <div className="row-span-4">
          <Switch>
            <Route path="/wallet/dashboard" component={DashBoard} />
            <Route path="/wallet/send-transaction" component={SendTransaction} />
            <Redirect from="/wallet" to="wallet/dashboard" />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Interface;
