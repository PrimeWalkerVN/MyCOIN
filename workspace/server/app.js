const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');
const globalErrorHandler = require('./src/controllers/errorsController');
const AppError = require('./src/utils/AppError');
const BlockChain = require('./src/models/BlockChain');
const { initWallet } = require('./src/models/Wallet');

const app = express();

// view engine setup
app.set('views', path.join(`${__dirname}/src`, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.enable('trust proxy');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(`${__dirname}/src`, 'public')));

// routes
const chainRoutes = require('./src/routes/blockchain');
const walletRoutes = require('./src/routes/wallet');
const indexRoutes = require('./src/routes/index');

app.use('/', indexRoutes);
app.use('/blockchain', chainRoutes);
app.use('/wallet', walletRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});
const p2pPort = parseInt(process.env.P2P_PORT, 10) || 6000;

BlockChain.initP2PServer(p2pPort);
initWallet();

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.method} - ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
