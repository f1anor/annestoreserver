const mongoose = require("../libs/mongoose");
const config = require("../config/db");
const bcrypt = require("bcryptjs");

const UserSchema = mongoose.Schema({
  date: {
    type: Number,
    require: true,
  },
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  gender: {
    type: String,
    require: false,
  },
  age: {
    type: Number,
    require: false,
  },
  adress: {
    type: String,
    require: false,
  },
  phone: {
    type: String,
    require: false,
  },
});

const User = (module.exports = mongoose.model("User", UserSchema));

// Получить всех пользователей но с фильтрами (например по дате добавления)
module.exports.getUsers = async (filter) => {
  return await User.find(filter);
};

// Добавить нового пользователя
// TODO: Переписать. Сделать создание пароля через bcrypt
module.exports.addUser = async (user) => {
  const newUser = new User({
    date: Date.now(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: user.password,
  });
  return await newUser.save();
};
