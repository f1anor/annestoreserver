const mongoose = require("../libs/mongoose");
const autoIncrement = require("mongoose-auto-increment");

const OrderSchema = mongoose.Schema({
  number: {
    type: Number,
  },
  status: {
    type: String,
    default: "new",
  },
  creationDate: {
    type: Number,
    require: true,
  },
  changeDate: {
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
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  products: [],
  userNotes: [],
  managerNotes: [],
});

OrderSchema.plugin(autoIncrement.plugin, "number");

const Order = (module.exports = mongoose.model("Order", OrderSchema));

module.exports.addOrder = async (order) => {
  const newOrder = new Order({
    email: order.email,
    phone: order.phone,
    creationDate: Date.now(),
    firstName: order.firstName,
    lastName: order.lastName,
    products: order.products.products,
    managerNotes: order.managerNotes.notes,
  });

  return await newOrder.save();
};

module.exports.updateOrder = async (id, order) => {
  const updatedOrder = await Order.findById(id);
  updatedOrder.changeDate = Date.now();
  updatedOrder.email = order.email;
  updatedOrder.phone = order.phone;
  updatedOrder.firstName = order.firstName;
  updatedOrder.lastName = order.lastName;
  updatedOrder.products = order.products.products;
  updatedOrder.managerNotes = order.managerNotes.notes;

  return await updatedOrder.save();
};

module.exports.getOrders = async (
  filter = {},
  sort = { creationDate: -1 },
  search
) => {
  return await Order.find({ ...filter, ...search }).sort(sort);
};

module.exports.changeStatus = async (id, status) => {
  const order = await Order.findById(id);
  order.status = status;
  return await order.save();
};

module.exports.getOrderById = async (id) => {
  return await Order.findById(id);
};

module.exports.findByProducts = async (idsArr) => {
  return await Order.find({
    "products.id": { $in: idsArr },
    status: { $ne: "deleted" },
  });
};
