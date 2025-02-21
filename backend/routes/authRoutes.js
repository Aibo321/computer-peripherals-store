const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();
const { check, validationResult } = require("express-validator");
// Вход в систему
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Invalid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;
      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ message: "User already exists" });

      const user = new User({ name, email, password, role });
      await user.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверяем пользователя
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Создаем токен
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with a hashed password
 *     parameters:
 *       - in: body
 *         name: user
 *         required: true
 *         description: User data
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - email
 *             - password
 *           properties:
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             password:
 *               type: string
 *               example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
