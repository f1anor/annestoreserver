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
  name: {
    type: String,
    require: true,
  },
  delivery: {
    type: String,
    require: true,
  },
  customPrice: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  deliveryPrice: {
    type: Number,
    default: 0,
  },
  postIndex: {
    type: String,
    require: false,
  },
  adress: {
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
    email: order.email, // Email
    phone: order.phone, // Телефон
    creationDate: Date.now(), // Дата создания
    name: order.name, // Имя и фамилия
    products: order.products, // Массив с продуктами
    managerNotes: order.managerNotes, // Заметки менеджера
    price: order.price, // Сумма к оплате
    customPrice: order.customPrice, // Тип образования суммы. Ручной или автоматический
    adress: order.adress, // Адресс доставки. Либо адресс пункта самовывоза
    postIndex: order.postIndex, // Почтовый индекс
    deliveryPrice: order.deliveryPrice, // Стоимость доставки
    delivery: order.delivery, // Тип доставки. Самовывоз или Доставка почтой
  });

  return await newOrder.save();
};

// Добавить в заметку в заказ
module.exports.addNoteToOrder = async (id, values) => {
  const order = await Order.findById(id);
  if (!order) throw new Error("Заказ не найден");

  if (!order.managerNotes) order.managerNotes = [];

  order.managerNotes.push({ ...values, date: Date.now() });
  return await order.save();
};

// Удалить заметку из заказа
module.exports.removeNote = async (id, time) => {
  const order = await Order.findById(id);
  if (!order) throw new Error("Заказ не найден");

  if (!order.managerNotes) order.managerNotes = [];

  order.managerNotes = order.managerNotes.filter(
    (note) => +note.date !== +time
  );

  return await order.save();
};

// Сохранение изменений в заказ
module.exports.updateOrder = async (id, order) => {
  const updatedOrder = await Order.findById(id);

  updatedOrder.changeDate = Date.now(); // Дата внесения изменений в заказ
  updatedOrder.email = order.email; // Email
  updatedOrder.phone = order.phone; // Телефон
  updatedOrder.name = order.name; // Имя и фамилия
  updatedOrder.products = order.products; // Массив с продуктами
  updatedOrder.managerNotes = order.managerNotes; // Заметки менеджера
  updatedOrder.price = order.price; // Сумма к оплате
  updatedOrder.customPrice = order.customPrice; // Тип образования суммы. Ручной или автоматический
  updatedOrder.adress = order.adress; // Адресс доставки. Либо адресс пункта самовывоза
  updatedOrder.postIndex = order.postIndex; // Почтовый индекс
  updatedOrder.deliveryPrice = order.deliveryPrice; // Стоимость доставки
  updatedOrder.delivery = order.delivery; // Тип доставки. Самовывоз или Доставка почтой

  return await updatedOrder.save();
};

// Получить все заказы с фильтрами сортировкой и поиском
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

module.exports.removeOrder = async (id) => {
  return await Order.deleteOne({ _id: id });
};
