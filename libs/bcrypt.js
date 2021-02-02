const bcrypt = require("bcryptjs");

module.exports.comparePasswords = async (userPwd, pwd) => {
  console.log(userPwd, pwd);
  return await bcrypt.compare(userPwd, pwd).catch((err) => console.log(err));
};
