export function padZero(v, len = 2) {
  return v.toString().padStart(len, '0');
}

export function getCurrent24Time() {
  let dt = new Date(),
    h = padZero(dt.getHours()),
    m = padZero(dt.getMinutes());

  return `${h}:${m}`;
}

export function formatTime(format, time24 = '') {
  if (time24 === '') {
    time24 = getCurrent24Time();
  }

  if (format === '12h') {
    let [h, m] = time24.split(':').map(v => parseInt(v)),
      xm = h < 12 ? 'a.m.' : 'p.m.';

    if (h === 0) {
      h = 12;
    } else if (h > 12) {
      h = h - 12;
    }

    m = padZero(m);

    return `${h}:${m} ${xm}`;
  } else {
    return time24;
  }
}
