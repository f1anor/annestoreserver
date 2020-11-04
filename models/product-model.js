const mongoose = require("../libs/mongoose");

const ProductSchema = mongoose.Schema({
  time: {
    type: Date,
    require: true,
  },
  article: { type: Number },
  views: {
    type: Number,
    default: 0,
  },
  stars: {
    type: Number,
    default: 0,
  },
  starsCount: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  price: {
    type: Number,
    require: true,
  },
  color: {
    type: String,
    require: false,
  },
  category: [],
  size: {
    type: String,
    require: false,
  },
  gender: {
    type: String,
    require: false,
  },
  imgs: {
    img1: {
      small: {
        type: String,
        default: null,
      },
      large: {
        type: String,
        default: null,
      },
    },
    img2: {
      small: {
        type: String,
        default: null,
      },
      large: {
        type: String,
        default: null,
      },
    },
    img3: {
      small: {
        type: String,
        default: null,
      },
      large: {
        type: String,
        default: null,
      },
    },
  },
  composition: {
    material1: {
      title: {
        type: String,
        default: null,
      },
      percent: {
        type: Number,
        default: null,
      },
    },
    material2: {
      title: {
        type: String,
        default: null,
      },
      percent: {
        type: Number,
        default: null,
      },
    },
    material3: {
      title: {
        type: String,
        default: null,
      },
      percent: {
        type: Number,
        default: null,
      },
    },
    material4: {
      title: {
        type: String,
        default: null,
      },
      percent: {
        type: Number,
        default: null,
      },
    },
    material5: {
      title: {
        type: String,
        default: null,
      },
      percent: {
        type: Number,
        default: null,
      },
    },
  },
});

const Product = (module.exports = mongoose.model("Product", ProductSchema));

module.exports.addProduct = async (product) => {
  const last = await Product.findOne().sort({ article: -1 });
  const newProduct = new Product({
    article: !!last ? last.article + 1 : 0,
    time: Date.now(),
    title: product.title,
    description: product.content,
    price: product.price,
    category: product.category,
    size: product.size ? product.size[0] : "",
    color: product.color,
    gender: product.gender,
    composition: {
      material1: {
        title: product.composition1title,
        percent: product.composition1value,
      },
      material2: {
        title: product.composition2title,
        percent: product.composition2value,
      },
      material3: {
        title: product.composition3title,
        percent: product.composition3value,
      },
      material4: {
        title: product.composition4title,
        percent: product.composition4value,
      },
      material5: {
        title: product.composition5title,
        percent: product.composition5value,
      },
    },
  });
  return newProduct;
};

module.exports.saveImgs = async (product, imgsArr) => {
  console.log(imgsArr[0]);
  product.imgs.img1 = imgsArr[0];
  product.imgs.img2 = imgsArr[1];
  product.imgs.img3 = imgsArr[2];
  return await product.save();
};

module.exports.getProducts = async (sort, filter) => {
  return await Product.find(filter).sort(sort);
};

module.exports.deleteProducts = async (selected) => {
  return await Product.deleteMany({ _id: selected });
};

module.exports.getByArticle = async (article) => {
  return await Product.findOne({ article });
};
