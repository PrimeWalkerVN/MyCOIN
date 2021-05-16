import { Suspense } from 'react';
import { Redirect, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import './App.css';
import Loading from './components/core/Loading';
import NotFound from './components/core/NotFound';
import { createBrowserHistory } from 'history';
import Intro from './components/intro/Intro';
const history = createBrowserHistory();

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Router history={history}>
        <Switch>
          <Route path="/" component={Intro} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </Suspense>
  );
}

export default App;
