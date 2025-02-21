const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 1. Получить все заказы пользователя
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;

    let match = { userId: req.user.id };
    if (status) match.status = status;

    const orders = await Order.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// 📌 2. Оформить заказ (очищает корзину и создает заказ)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "products.productId",
      model: "Product"
    });

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Вычисляем сумму заказа
    const totalPrice = cart.products.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);

    // Создаем заказ
    const newOrder = new Order({
      user: req.user.id, // ✅ user вместо userId
      products: cart.products.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
      })),
      totalPrice,
    });

    await newOrder.save();

    // Очищаем корзину
    await Cart.findOneAndDelete({ user: req.user.id });

    res.json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 📌 3. Отменить заказ (если он еще в статусе "pending")
router.put("/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending") return res.status(400).json({ message: "Order cannot be cancelled" });

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
