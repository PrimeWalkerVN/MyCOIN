import { Suspense } from 'react';
import { Route, BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import './App.css';
import Loading from './components/core/Loading';
import NotFound from './components/core/NotFound';
import { createBrowserHistory } from 'history';
import Header from './components/core/Header';
import Wallet from './components/wallet/Wallet';
import Explorer from './components/explorer/Explorer';
import Interface from './components/wallet/Interface/Interface';
const history = createBrowserHistory();

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Router history={history}>
        <Header />
        <Switch>
          <Route path="/wallet" component={Interface} />
          <Route path="/intro" component={Wallet} />
          <Route path="/explorer" component={Explorer} />
          <Redirect from="/" to="/wallet" />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </Suspense>
  );
}

export default App;
