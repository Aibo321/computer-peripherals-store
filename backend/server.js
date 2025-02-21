const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

app.post("/api/orders/create", async (req, res) => {
  const userId = req.user.id;

  try {
      let cart = await Cart.findOne({ user: userId });
      if (!cart || cart.products.length === 0) {
          return res.status(400).json({ message: "Cart is empty" });
      }

      for (let item of cart.products) {
          let product = await Product.findById(item.productId);
          if (!product) return res.status(404).json({ message: "Product not found" });

          product.stock -= item.quantity;
          await product.save();
      }

      cart.products = [];
      await cart.save();

      res.json({ message: "Purchase successful!" });
  } catch (error) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: "Server error" });
  }
});
