const { isEmpty } = require('lodash');
const { deleteWallet, createWallet } = require('../models/Wallet');
const AppError = require('../utils/AppError.js');

exports.accessWallet = async (req, res, next) => {
  try {
    const { pk } = req.body;
    if (isEmpty(pk)) {
      return next(new AppError('Need private key', 400));
    }
    await deleteWallet();
    await createWallet(pk);
    res.status(200).json({
      status: 'success'
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

exports.deleteWallet = async (req, res, next) => {
  try {
    await deleteWallet();
    res.status(200).json({
      status: 'success'
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};
