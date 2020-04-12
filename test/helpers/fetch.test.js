import fetchMock from 'fetch-mock-jest';
import { woodpeckerFetch } from '../../src/helpers/fetch';

describe('woodpeckerFetch', () => {
  const base = 'http://example.com';
  const data = { data: 'simple' };

  fetchMock
    .get(`${base}/simple`, data)
    .get(`${base}/timeout-3000`, data, { delay: 3000 })
    .once(`${base}/timeout-3000-once`, {}, { delay: 3000 })
    .get(`${base}/timeout-3000-once`, data, {
      delay: 1000,
      overwriteRoutes: false
    });

  test('simple fetch', async () => {
    let res = await woodpeckerFetch(`${base}/simple`);
    expect(res).toEqual(data);
  });

  test('timeout issue', async () => {
    await expect(
      woodpeckerFetch(`${base}/timeout-3000`, {}, { limit: 1, timeout: 2000 })
    ).rejects.toEqual({ status: 408, statusText: 'Timeout reached.' });
  });

  test('overcomes one timeout', async () => {
    let res = await woodpeckerFetch(
      `${base}/timeout-3000-once`,
      {},
      {
        limit: 2,
        timeout: 1500
      }
    );
    expect(res).toEqual(data);
  });
});
