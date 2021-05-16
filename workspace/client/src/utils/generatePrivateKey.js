const { ec } = require('elliptic');
const EC = new ec('secp256k1');

const generatePrivateKey = () => {
  const keyPair = EC.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
};
export default generatePrivateKey;
