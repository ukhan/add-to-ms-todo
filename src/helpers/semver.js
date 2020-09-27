export default (ver) => {
  let va = ver.split('.');

  return {
    major: va[0],
    minor: va[1],
    patch: va[2],
  };
};
