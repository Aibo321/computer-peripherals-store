const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 1. Получить корзину пользователя
router.get("/", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("products.productId");
    if (!cart || cart.products.length === 0) return res.json({ message: "Cart is empty" });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.use(authMiddleware, (req, res, next) => {
  console.log("🛠️ Authenticated User ID:", req.user.id);
  next();
});


// 📌 2. Добавить товар в корзину
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, products: [] }); // ✅ Теперь привязан `user`
    }

    const existingProduct = cart.products.find((p) => p.productId.toString() === productId);
    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ productId, quantity });
    }

    await cart.save();
    res.json({ message: "Product added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
router.put("/update", authMiddleware, async (req, res) => {
  try {
      const { productId, quantity } = req.body;
      const userId = req.user.id;

      console.log(`🔄 Updating cart for user: ${userId}, Product: ${productId}, Quantity: ${quantity}`);

      if (!productId || !quantity) {
          return res.status(400).json({ message: "Product ID and quantity are required" });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          console.log("❌ Cart not found for user:", userId);
          return res.status(404).json({ message: "" });
      }

      const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
      if (productIndex === -1) {
          return res.status(404).json({ message: "Product not found in cart" });
      }

      cart.products[productIndex].quantity = quantity;
      await cart.save();

      res.json({ message: "✅ Cart updated successfully", cart });
  } catch (error) {
      console.error("❌ Error updating cart:", error);
      res.status(500).json({ message: "Server error", error });
  }
});

// 📌 3. Очистить корзину
router.delete("/remove/:productId", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    console.log("🛠️ Deleting product from cart:", productId);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log("❌ Cart not found for user:", userId);
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.products.splice(productIndex, 1);
    await cart.save();

    res.json({ message: "✅ Product removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "❌ Server error", error });
  }
});





module.exports = router;
