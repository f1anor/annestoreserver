const bcrypt = require("bcryptjs");

module.exports.comparePasswords = async (userPwd, pwd) => {
  console.info(userPwd, pwd);
  return await bcrypt.compare(userPwd, pwd).catch((err) => console.info(err));
};
