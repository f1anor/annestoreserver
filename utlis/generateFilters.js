const compareOrdersFilters = (config, filters) => {
  const obj = {};
  for (let key in filters) {
    if (!config.hasOwnProperty(key)) continue;
    obj[config[key]] = filters[key];
  }
  return obj;
};

module.exports = { compareOrdersFilters };
