module.exports = (arr, page, pagesize) => {
  return arr.filter(
    (item, index) =>
      index + 1 > page * pagesize - pagesize && index + 1 <= page * pagesize
  );
};
