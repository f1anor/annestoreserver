const mongoose = require("../libs/mongoose");
const config = require("../config/db");
const bcrypt = require("bcryptjs");

const UserSchema = mongoose.Schema({
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  about: {
    work: {
      type: String,
      default: null,
    },
    school: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    familyStatus: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    site: {
      type: String,
      default: null,
    },
  },
  social: {
    vk: {
      type: String,
      default: null,
    },
    facebook: {
      type: String,
      default: null,
    },
    twitter: {
      type: String,
      default: null,
    },
    instagram: {
      type: String,
      default: null,
    },
  },
  followed: {
    type: Boolean,
    default: false,
  },
  followedUsers: [],
  status: {
    type: String,
    default: null,
  },
  photos: {
    small: {
      type: String,
      default: null,
    },
    large: {
      type: String,
      default: null,
    },
  },
  wallpaper: {
    type: String,
    default: null,
  },
  age: {
    type: String,
    require: true,
  },
  gender: {
    type: String,
    require: true,
  },
  login: {
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
});

const User = (module.exports = mongoose.model("User", UserSchema));

module.exports.getUsers = async (followedUsers) => {
  let users = await User.find();
  if (!!followedUsers) {
    users = users.map((user) => {
      followedUsers.forEach((id) => {
        if (id.toString() === user._id.toString()) user.followed = true;
      });
      return user;
    });
  }
  return users;
};

module.exports.getUser = async (id) => {
  return await User.findOne({ _id: id });
};

module.exports.setFollow = async (user, id) => {
  const index = user.followedUsers.findIndex((item) => id === item);
  if (index === -1) user.followedUsers.push(id);
  return await user.save();
};

module.exports.setUnfollow = async (user, id) => {
  const index = user.followedUsers.findIndex((item) => id === item);
  if (index !== -1) user.followedUsers.splice(index, 1);
  return await user.save();
};

module.exports.updateStatus = async (user, status) => {
  user.status = status;
  return await user.save();
};

module.exports.getUserByLogin = async (login) => {
  return await User.findOne({ login });
};

module.exports.getUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  console.log(email);
  return await User.findOne({ email });
};

module.exports.addUser = async ({
  firstName,
  lastName,
  email,
  age,
  password,
}) => {
  const newUser = new User({ firstName, lastName, email, age, password });
  return await newUser.save();
};

module.exports.comparePasswords = async (pwd, userPwd) => {
  const success = await bcrypt
    .compare(pwd, userPwd)
    .catch((err) => console.log(err));
  return success;
};
