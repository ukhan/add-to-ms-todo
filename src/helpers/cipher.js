const CryptoJS = require('crypto-js');

const defaultSecret = process.env.CIPHER_KEY;

export function encrypt(str, secret = defaultSecret) {
  return CryptoJS.AES.encrypt(str.toString(), secret);
}

export function decrypt(str, secret = defaultSecret) {
  return CryptoJS.AES.decrypt(str.toString(), secret).toString(CryptoJS.enc.Utf8);
}

export default {
  encrypt,
  decrypt
};
