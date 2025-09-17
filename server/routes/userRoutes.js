const express = require("express");
const Controller = require("../controllers/userController");

const router = express.Router();

router.post("/signup", Controller.signupUser);
router.post("/login", Controller.loginUser);

module.exports = router;
