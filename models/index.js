const { dynamodb } = require("../utils/aws-helper");

const tableName = "Products"; // Tên bảng mới trên AWS của bạn

const ProductModel = {
  // Lấy danh sách sản phẩm
  getProducts: async () => {
    const params = { TableName: tableName };
    try {
      const data = await dynamodb.scan(params).promise();
      return data.Items;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ DynamoDB:", error);
      throw error;
    }
  },

  deleteProductById: async (productId) => {
    const params = {
      TableName: tableName,
      Key: {
        "id": productId
      }
    }
    try {
      await dynamodb.delete(params).promise()
    }catch(error){
      console.error("Lỗi khi xóa dữ liệu ở AWS", error);
      throw error;
    }
  },

  // Thêm sản phẩm mới (Để bạn dùng cho chức năng Create)
  createProduct: async (product) => {
    const params = {
      TableName: tableName,
      Item: product,
    };
    try {
        return await dynamodb.put(params).promise();
    } catch (error) {
        console.error("Lỗi DynamoDB PutItem:", error);
        throw error;
    }
  },

  getProductById: async (id) => {
        const params = {
            TableName: "Products", // Tên bảng của Thuy
            Key: { "id": id } // Khóa chính để tìm đúng đối tượng
        };
        try {
            const res = await dynamodb.get(params).promise();
            return res.Item; // Trả về dữ liệu đối tượng
        } catch (error) {
            console.error("Lỗi lấy chi tiết sản phẩm:", error);
            throw error;
        }
    },

  // Hàm cập nhật (Dùng Put để ghi đè dữ liệu cũ dựa trên ID)
    updateProduct: async (product) => {
        const params = {
            TableName: "Products", // Tên bảng của Thuy trên AWS
            Item: product // Đối tượng bao gồm id, name, price, quantity, image
        };
        try {
            await dynamodb.put(params).promise();
            return true;
        } catch (error) {
            console.error("Lỗi tại Model khi cập nhật DynamoDB:", error);
            throw error;
        }
    },


searchProductsByName: async (keyword) => {
        const params = {
            TableName: "Products",
            // Lọc các sản phẩm mà trường 'name' chứa từ khóa (không phân biệt hoa thường cần xử lý thêm)
            FilterExpression: "contains(#name, :keyword)",
            ExpressionAttributeNames: {
                "#name": "name" // 'name' là từ khóa dự phòng trong DynamoDB nên cần alias
            },
            ExpressionAttributeValues: {
                ":keyword": keyword
            }
        };

        try {
            const data = await dynamodb.scan(params).promise();
            return data.Items;
        } catch (error) {
            console.error("Lỗi khi tìm kiếm sản phẩm:", error);
            throw error;
        }
    }

};


module.exports = ProductModel;