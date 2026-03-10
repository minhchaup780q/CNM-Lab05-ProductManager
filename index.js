const express = require("express");
const app = express();
const session = require('express-session');

// Render giao diện bằng EJS
app.set("view engine", "ejs");
app.set("views", "./views");

// Cấu hình session cho giỏ hàng
app.use(session({
  secret: 'my-secret-key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Để false nếu chạy localhost
}));


const productRoute = require("./routes/product.route");
app.use("/products", productRoute); // Đổi prefix route




app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000/products");
});
