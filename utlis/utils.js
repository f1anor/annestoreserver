const bcrypt = require("bcryptjs");

module.exports = (num, length = 3) => {
  console.log(123123, num, length);
  if (num.toString().length >= length) {
    return num;
  } else {
    let arr = num.toString().split("").reverse();
    arr = [...arr, 0, 0, 0, 0];
    arr.length = length;
    return arr.reverse().join("");
  }
};

module.exports.getPass = async (pwd) => {
  let status = true;

  const salt = await bcrypt.genSalt(10).catch((err) => {
    console.log(err);
    status = false;
  });

  const hash = await bcrypt.hash(pwd, salt).catch((err) => {
    console.log(err);
    status = false;
  });

  return status ? hash : false;
};

module.exports.getParams = (img) => {
  return {
    initPath: `${__dirname}/../public/${product[img].preloadedImg}`,
    finalPath: `${__dirname}/../public/assets/products/${ans._id}`,
    output: `assets/products/${ans._id}`,
    smallFileName: `${img}Small.jpg`,
    largeFileName: `${img}Large.jpg`,
    zoom: product[img].zoom || 1,
    x: product[img].x || 0,
    y: product[img].y || 0,
    width: product[img].width,
    height: product[img].height,
  };
};

module.exports.getNullImg = () => {
  return {
    small: null,
    large: null,
  };
};
