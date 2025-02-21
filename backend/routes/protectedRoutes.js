const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Тест: Обычный защищенный маршрут
router.get("/user", authMiddleware, (req, res) => {
  res.json({ message: "Welcome, authenticated user!", user: req.user });
});

// 📌 Тест: Только для админов
router.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Welcome, admin!", user: req.user });
});

module.exports = router;
