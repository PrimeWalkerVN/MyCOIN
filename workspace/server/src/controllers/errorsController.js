const sendErrorDev = (err, req, res) => {
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message
  });
  //   // B) RENDERED WEBSITE
  //   console.error('ERROR 💥', err);
  //   return res.status(err.statusCode).render('error', {
  //     title: 'Something went wrong!',
  //     msg: err.message,
  //   });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  sendErrorDev(err, req, res);
  next();
};
