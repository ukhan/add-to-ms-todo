import log from './log';

const TIMEOUT_INIT = 3000;
const TIMEOUT_STEP = 2000;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function safeJson(response) {
  if (response.ok) {
    return response.json();
  } else {
    throw response.statusText;
  }
}

function timeoutFetch(url, options, timeout = null) {
  if (Number.isInteger(timeout)) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(
          () => reject({ status: 408, statusText: 'Timeout reached' }),
          timeout
        )
      )
    ]);
  } else {
    return fetch(url, options);
  }
}

export function woodpeckerFetch(
  url,
  options = {},
  {
    limit = 5,
    delay = 200,
    statusCodes = [408, 413, 429, 500, 502, 503, 504],
    timeout = TIMEOUT_INIT,
    debug = false
  } = {}
) {
  options['credentials'] = 'omit';

  const repeat = status =>
    wait(delay).then(() => {
      return woodpeckerFetch(url, options, {
        limit: limit - 1,
        delay,
        statusCodes,
        timeout: status === 408 ? timeout + TIMEOUT_STEP : timeout,
        debug
      });
    });

  if (debug) log.addRequest(limit, timeout, options.method, url, options.body);

  return timeoutFetch(url, options, timeout)
    .then(response => {
      if (response.ok) {
        if (debug) log.addResponse('Ok');
        return response.json();
      } else {
        if (debug) log.addResponse(response);
        if (statusCodes.indexOf(response.status) !== -1 && limit > 1) {
          return repeat(response.status);
        } else {
          throw response;
        }
      }
    })
    .catch(error => {
      if (debug) log.addResponse(error);

      if (limit > 1) {
        return repeat(error.status);
      } else {
        throw error;
      }
    });
}
