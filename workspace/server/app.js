const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const globalErrorHandler = require('./src/controllers/errorsController');

const app = express();

// view engine setup
app.set('views', path.join(__dirname + '/src', 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname + '/src', 'public')));

// routes
const chainRoutes = require('./src/routes/blockchain');
const indexRoutes = require('./src/routes/index');

app.use('/', indexRoutes);
app.use('/blockchain', chainRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.all('*', (req, res, next) => {
  next(new ErrorHandler(404, `Can't find ${req.method} - ${req.originalUrl} on this server!`));
});
app.use(globalErrorHandler);

module.exports = app;
