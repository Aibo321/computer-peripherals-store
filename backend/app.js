require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

const setupSwagger = require("./config/swagger");

const app = express();

// 📦 Middleware (Поднимаем вверх)
app.use(express.json()); // ✅ Корректная обработка JSON в req.body
app.use(express.urlencoded({ extended: true })); // ✅ Поддержка form-data

// 🛡️ CORS (Разрешаем все источники)
app.use(cors({ origin: "*" }));

// 🛠️ Логирование запросов
app.use(morgan("dev"));

// 🚦 Rate Limiting (100 запросов за 15 минут с одного IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// 📝 Swagger-документация
setupSwagger(app);

// 📂 Маршруты
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/products", productRoutes); // ✅ Перенесли после express.json()
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// 📡 Тестовый маршрут
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔗 Подключение к MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = app;
