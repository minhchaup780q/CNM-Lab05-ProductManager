const multer = require("multer");
const path = require("path");

// Set up Multer storage options
// Sử dụng memoryStorage sẽ giúp chúng ta thao tác với các tập tin trước khi lưu
// vào bộ nhớ hoặc database
const storage = multer.memoryStorage();

// Create Multer middleware instance for single file upload
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5, // option để quản lý file size, ở đây là maximun file size đc upload
//   },
// }).single("image"); // phương thức để chỉ đinh cho phép upload 1 hay nhiều file
// // với phương thức này đc chỉ định chỉ cho upload 1 file. "image" chính là tên
// // của input bên form(client)


// Xử lý chỉ cảnh báo khi sai định dạng ảnh
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        // Thay vì cb(new Error(...)), ta truyền null để Multer không báo lỗi hệ thống
        cb(null, false); 
    }
}).single("image");
module.exports = upload;
