const bcrypt = require("bcryptjs");

const multerConfig = require("../config/multer");

module.exports = (num, length = 3) => {
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
    console.info(err);
    status = false;
  });

  const hash = await bcrypt.hash(pwd, salt).catch((err) => {
    console.info(err);
    status = false;
  });

  return status ? hash : false;
};

module.exports.getProductImgConvertParams = (img, prefix, id) => {
  return {
    initPath: `${multerConfig.core}${img.preloadImg}`,
    finalPath: `${multerConfig.core}${multerConfig.assets}${id.toString()}`,
    output: `${multerConfig.assets}${id}`,
    smallFileName: `${prefix}_Small.jpg`,
    mediumFileName: `${prefix}_Medium.jpg`,
    largeFileName: `${prefix}_Large.jpg`,
    zoom: img.zoom || 1,
    x: img.x || 0,
    y: img.y || 0,
    width: img.width || 348,
    height: img.height || 348,
  };
};

module.exports.getAvatarImgConvertParams = (img, id) => {
  return {
    initPath: `${multerConfig.core}${img.avatarTmp}`,
    finalPath: `${multerConfig.core}${multerConfig.users}${id.toString()}`,
    output: `${multerConfig.assets}${id}`,
    smallFileName: `Avatar_Small.jpg`,
    mediumFileName: `Avatar_Medium.jpg`,
    largeFileName: `Avatar_Large.jpg`,
    zoom: img.zoom || 1,
    x: img.x || 0,
    y: img.y || 0,
    width: img.width || 248,
    height: img.height || 248,
  };
};

module.exports.formatArticle = (num, length = 3) => {
  if (num.toString().length >= length) {
    return num;
  } else {
    let arr = num.toString().split("").reverse();
    arr = [...arr, 0, 0, 0, 0];
    arr.length = length;
    return arr.reverse().join("");
  }
};
