const express = require("express");
const Product = require("../models/Product");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 1. Получить все товары
router.get("/:id", async (req, res) => {
  try {
      const product = await Product.findById(req.params.id);
      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
});


// 📌 2. Получить товар по ID
router.get("/", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;

    let match = {};
    if (search) match.name = { $regex: search, $options: "i" };
    if (category) match.category = category;
    if (minPrice || maxPrice) match.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };

    const products = await Product.aggregate([
      { $match: match },
      { $sort: sort === "price_asc" ? { price: 1 } : sort === "price_desc" ? { price: -1 } : { createdAt: -1 } },
    ]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// 📌 3. Добавить новый товар (Только админ)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
      console.log("📥 Incoming request body:", req.body); // 🟢 Логируем req.body

      const { name, category, price, stock, description, image } = req.body;

      // 🛑 Проверяем поля на сервере
      if (!name || !category || !price || !image) {
          console.log("❌ Missing required fields:", { name, category, price, image });
          return res.status(400).json({ message: "All required fields must be filled" });
      }

      // 🔍 Логируем типы данных
      console.log("🟢 Data Types:", {
          name: typeof name,
          category: typeof category,
          price: typeof price,
          stock: typeof stock,
          description: typeof description,
          image: typeof image,
      });

      const product = new Product({
          name,
          category,
          price: Number(price),
          stock: Number(stock) || 0,
          description: description || "",
          image
      });

      await product.save();
      res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
      console.error("❌ Error adding product:", error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});
// 📌 4. Обновить товар (Только админ)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, price, stock, description, image } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, stock, description, image },
      { new: true }
    );

    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 📌 5. Удалить товар (Только админ)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
