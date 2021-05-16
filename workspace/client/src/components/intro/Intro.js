import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import Header from '../core/Header';
import Explorer from '../explorer/Explorer';
import Wallet from '../wallet/Wallet';

const Intro = () => {
  return (
    <div className="container max-w-full h-screen">
      <Header />
      <Switch>
        <Route path="/wallet" component={Wallet} />
        <Route path="/explorer" component={Explorer} />
        <Redirect from="/" to="/wallet" />
      </Switch>
    </div>
  );
};

export default Intro;
