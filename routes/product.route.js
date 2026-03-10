    const express = require("express");
    const router = express.Router();
    const productController = require("../controllers/index"); // Nhớ đảm bảo đúng tên thư mục controllers

    router.get("/", productController.getAll);
    router.post("/delete/:id", productController.deleteProduct); 

    // create
    router.get("/create", productController.showCreateForm);
    const upload = require("../middleware/upload")
    router.post("/create", upload, productController.createProduct)

    // edit
    router.get("/edit/:id", productController.showEditForm);
    router.post("/edit", upload, productController.updateProduct);
    module.exports = router;

    // cart
    router.get("/cart", productController.showCart);
    router.get("/add-to-cart/:id", productController.addToCart);

    // Route tăng số lượng
    router.get("/cart/increase/:id", productController.increaseQuantity);

    // Route giảm số lượng
    router.get("/cart/decrease/:id", productController.decreaseQuantity);

    // Route xóa hẳn sản phẩm khỏi giỏ
    router.get("/cart/remove/:id", productController.removeFromCart);