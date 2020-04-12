const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function safeJson(response) {
  if (response.ok) {
    return response.json();
  } else {
    throw response.statusText;
  }
}

function timeoutFetch(url, options, timeout) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(
        () => reject({ status: 408, statusText: 'Timeout reached.' }),
        timeout
      )
    )
  ]);
}

export function woodpeckerFetch(
  url,
  options = {},
  {
    limit = 3,
    delay = 200,
    statusCodes = [408, 413, 429, 500, 502, 503, 504],
    timeout = 2000
  } = {}
) {
  const repeat = () =>
    wait(delay).then(() => {
      return woodpeckerFetch(url, options, {
        limit: limit - 1,
        delay,
        statusCodes,
        timeout
      });
    });

  return timeoutFetch(url, options, timeout)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        if (statusCodes.indexOf(response.status) !== -1 && limit > 1) {
          return repeat();
        } else {
          throw response;
        }
      }
    })
    .catch(error => {
      if (limit > 1) {
        return repeat();
      } else {
        throw error;
      }
    });
}
