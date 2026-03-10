const ProductModel = require("../models/index"); // Nhớ đảm bảo đúng tên thư mục models
const FileService = require("../service/file.service")
const ProductController = {};

// ProductController.getAll = async (req, res) => {
//   try {
//     const products = await ProductModel.getProducts();
//     // Render file index.ejs và truyền mảng products
//     return res.render("index", { products: products });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error getting products");
//   }
// };

ProductController.getAll = async (req, res) => {
    try {
        const keyword = req.query.name; // Lấy từ khóa từ ?name=abc trên URL
        let products;

        if (keyword && keyword.trim() !== "") {
            // Nếu có từ khóa, gọi hàm tìm kiếm
            products = await ProductModel.searchProductsByName(keyword.trim());
        } else {
            // Nếu không có, hiển thị tất cả như cũ
            products = await ProductModel.getProducts();
        }

        res.render("index", { 
            products: products, 
            keyword: keyword || "", // Truyền lại từ khóa để hiển thị trên ô input
            cloudfrontUrl: process.env.CLOUDFRONT_URL 
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách/tìm kiếm:", error);
        res.status(500).send("Lỗi hệ thống");
    }
};

ProductController.deleteProduct = async (req, res) => {
  const productID = req.params.id;
  try {
    // await ProductModel.deleteProductById(productID);

    // 1. Lấy thông tin sản phẩm từ DynamoDB trước khi xóa để biết tên file ảnh (Key)
    const product = await ProductModel.getProductById(productID);

    if (product) {
      // 2. Xóa ảnh trên S3 nếu sản phẩm có ảnh
      if (product.image && product.image !== "") {
        await FileService.deleteFile(product.image);
      }

      // 3. Xóa dữ liệu sản phẩm trong DynamoDB
      await ProductModel.deleteProductById(productID);
    }

    res.redirect("/products"); // Redirect về trang danh sách sản phẩm sau khi xóa
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).send("Error deleting product");
  }
};

ProductController.showCreateForm = (req, res) => {
  res.render("create")
};

// Kiểm tra dữ liệu: Đảm bảo người dùng nhập đủ các trường.
// Upload ảnh lên S3: Gọi hàm uploadFile (từ service/file.service.js) và truyền req.file vào để lấy URL ảnh.
// Lưu vào DynamoDB: Gom URL ảnh và dữ liệu text (req.body) lại rồi gửi xuống Model.

ProductController.createProduct = async (req, res) => {
  try{
    const {id, name, price, quantity} = req.body;
    const file = req.file; // File do Multer xử lý

    // Nếu file không tồn tại (do sai định dạng hoặc chưa chọn)
        if (!file) {
            // Thay vì để server crash, ta gửi cảnh báo về trình duyệt
            return res.status(400).send(`
                <script>
                    alert("Lỗi: File '${req.body.fileName || 'đã chọn'}' không hợp lệ! Chỉ chấp nhận JPG, PNG, GIF.");
                    window.history.back();
                </script>
            `);
        }

        
    // 2. Upload file lên S3
    const fileName = await FileService.uploadFile(file); // Hãy sửa hàm này để trả về Key/FileName

    // 1. Kiểm tra dữ liệu sơ bộ
    if (!file) return res.status(400).send("Vui lòng chọn hình ảnh!");

    // 3. Chuẩn bị Object để lưu vào DynamoDB
        const newProduct = {
            id: id,
            name: name,
            price: parseFloat(price), // Chuyển sang số thực
            quantity: parseInt(quantity), // Chuyển sang số nguyên
            image: fileName // Lưu URL từ S3
        };

        // 4. Gọi Model thực hiện lệnh PUT
        await ProductModel.createProduct(newProduct);

        // 5. Thành công thì quay lại trang danh sách
        res.redirect("/products");
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        res.status(500).send("Lỗi hệ thống khi thêm sản phẩm");
    }
};

ProductController.showEditForm = async (req, res) => {
    try {
        const id = req.params.id; // Lấy ID từ /edit/:id
        const product = await ProductModel.getProductById(id); // Lấy data từ DynamoDB
        
        if (product) {
            // Render file edit.ejs và truyền dữ liệu 'product' vào
            res.render("edit", { 
                product: product, 
                cloudfrontUrl: process.env.CLOUDFRONT_URL 
            });
        } else {
            res.status(404).send("Không tìm thấy sản phẩm để sửa");
        }
    } catch (error) {
        console.error("Lỗi hiển thị form sửa:", error);
        res.status(500).send("Lỗi hệ thống khi lấy dữ liệu cũ");
    }
};

ProductController.updateProduct = async (req, res) => {
    try {
        const { id, name, price, quantity, oldImage } = req.body;
        const file = req.file;
        let finalImage = oldImage; // Mặc định dùng lại tên ảnh cũ

        // Trường hợp người dùng chọn hình mới
        if (file) {
            // Upload hình mới lên S3 và lấy Key mới
            finalImage = await FileService.uploadFile(file);

             // 2. XÓA ẢNH CŨ TRÊN S3 (Chỉ xóa nếu trước đó đã có ảnh)
            if (oldImage && oldImage !== "") {
                await FileService.deleteFile(oldImage);
            }
        }
       

        const updatedProduct = {
            id: id,
            name: name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            image: finalImage // Có thể là Key mới hoặc Key cũ
        };

        await ProductModel.updateProduct(updatedProduct); // DynamoDB dùng PutItem để đè dữ liệu cũ
        res.redirect("/products");
    } catch (error) {
        console.error("Lỗi khi sửa sản phẩm:", error);
        res.status(500).send("Lỗi hệ thống khi cập nhật");
    }
};

// Thêm sản phẩm vào giỏ hàng
ProductController.addToCart = async (req, res) => {
    const id = req.params.id;
    try {
        const product = await ProductModel.getProductById(id);
        if (!product) return res.status(404).send("Sản phẩm không tồn tại");

        // Khởi tạo giỏ hàng nếu chưa có
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        const itemIndex = req.session.cart.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            req.session.cart[itemIndex].quantity += 1;
        } else {
            req.session.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        res.redirect("/products/cart");
    } catch (error) {
        res.status(500).send("Lỗi thêm vào giỏ hàng" + error);
    }
};

// Xem giỏ hàng và tính tổng tiền
ProductController.showCart = (req, res) => {
    const cart = req.session.cart || [];
    
    // Tính tổng tiền bằng hàm reduce
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.render("cart", { 
        cart: cart, 
        total: total,
        cloudfrontUrl: process.env.CLOUDFRONT_URL 
    });
};

// Tăng số lượng
ProductController.increaseQuantity = (req, res) => {
    const id = req.params.id;
    const cart = req.session.cart || [];
    const item = cart.find(i => i.id === id);
    
    if (item) {
        item.quantity += 1;
    }
    res.redirect("/products/cart");
};

// Giảm số lượng
ProductController.decreaseQuantity = (req, res) => {
    const id = req.params.id;
    const cart = req.session.cart || [];
    const itemIndex = cart.findIndex(i => i.id === id);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity -= 1;
        // Nếu giảm về 0 thì xóa sản phẩm đó luôn
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    res.redirect("/products/cart");
};

// Xóa sản phẩm
ProductController.removeFromCart = (req, res) => {
    const id = req.params.id;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.id !== id);
    }
    res.redirect("/products/cart");
};


module.exports = ProductController;