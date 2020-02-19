const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function safeJson(response) {
  if (response.ok) {
    return response.json();
  } else {
    throw response.statusText;
  }
}

export function woodpeckerFetch(
  url,
  options = {},
  {
    limit = 3,
    delay = 200,
    statusCodes = [408, 413, 429, 500, 502, 503, 504]
  } = {}
) {
  return fetch(url, options).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      if (statusCodes.indexOf(response.status) !== -1 && limit > 1) {
        return wait(delay).then(() => {
          return woodpeckerFetch(url, options, {
            limit: limit - 1,
            delay,
            statusCodes
          });
        });
      } else {
        throw response;
      }
    }
  });
}
