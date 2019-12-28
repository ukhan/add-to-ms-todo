import { encrypt, decrypt } from '../../src/helpers/cipher';

describe('Testing Cipher helper', () => {
  const secret = 'secret';
  const data = 'data for ciphering';

  test('encrypt returns data', () => {
    const encryptedData = encrypt(data, secret);
    expect(encryptedData.length).not.toEqual(0);
  });

  test('decrypt wrong data returns empty string', () => {
    const decryptedData = decrypt(data, secret);
    expect(decryptedData.length).toEqual(0);
  });

  test('decrypt encrypted data', () => {
    const encryptedData = encrypt(data, secret);
    const decryptedData = decrypt(encryptedData, secret);
    expect(decryptedData).toEqual(data);
  });
});
