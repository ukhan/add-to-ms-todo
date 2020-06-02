export default function themeSwitcher() {
  let body = document.body;
  let matcher = window.matchMedia('(prefers-color-scheme: dark)');
  matcher.addListener(onUpdate);
  onUpdate();

  function onUpdate() {
    const darkClass = 'dark';

    if (matcher.matches) {
      body.classList.add(darkClass);
    } else {
      body.classList.remove(darkClass);
    }
  }
}
