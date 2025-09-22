const User = require("../models/userSchema");
const bcrypt = require("bcrypt");

const signupUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Password validation
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    res
      .status(201)
      .json({ username: user.username, message: "User created..." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    res.status(200).json({ username: user.username, isLoggedIn: true });
  } catch (error) {
    res.status(400).json({ error: error.message, isLoggedIn: false });
  }
};

module.exports = {
  signupUser,
  loginUser,
};
