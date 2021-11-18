const mongoose = require("../libs/mongoose");

const AdminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  registerDate: {
    type: Number,
    require: true,
  },
  lastConnection: {
    type: Number,
    require: false,
  },
  email: {
    type: String,
    require: true,
  },
  phone: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  login: {
    type: String,
    require: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
  root: {
    type: Boolean,
    default: false,
  },
  ava: {
    small: {
      type: String,
      default: null,
    },
    medium: {
      type: String,
      default: null,
    },
    large: {
      type: String,
      default: null,
    },
  },
});

const Admin = (module.exports = mongoose.model("Admin", AdminSchema));

module.exports.getByEmail = async (email) => {
  return await Admin.findOne({ email });
};

module.exports.getByLogin = async (login) => {
  return await Admin.findOne({ login });
};

module.exports.getAdmins = async (filter = {}, sort = {}) => {
  return await Admin.find(filter, sort);
};

module.exports.addAdmin = async (values) => {
  const newAdmin = new Admin({
    login: values.login,
    firstName: values.firstName,
    lastName: values.lastName,
    registerDate: Date.now(),
    phone: values.phone,
    email: values.email,
    password: values.password,
  });

  return await newAdmin.save();
};

module.exports.saveAvatar = async (admin, ava) => {
  admin.ava = ava;
  return await admin.save();
};

module.exports.getAdmin = async (id) => {
  return await Admin.findById(id);
};

module.exports.setStatus = async (admin, status) => {
  admin.status = status;
  return await admin.save();
};

module.exports.setVisit = async (admin, date) => {
  admin.lastConnection = date;
  return await admin.save();
};

module.exports.removeAdmin = async (id) => {
  return await Admin.findByIdAndRemove(id);
};
