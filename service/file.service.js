require("dotenv").config();
const { s3 } = require("../utils/aws-helper");

const randomString = (numberCharacter) => {
  return `${Math.random()
    .toString(36)
    .substring(2, numberCharacter + 2)}`;
};

const FILE_TYPE_MATCH = ["image/png", "image/jpeg", "image/jpg", "image/gif"];

const uploadFile = async (file) => {
  const filePath = `${randomString(4)}-${new Date().getTime()}-${file?.originalname}`;

  if (FILE_TYPE_MATCH.indexOf(file.mimetype) === -1) {
    throw new Error(`${file?.originalname} is invalid!`);
  }

  const uploadParams = {
    Bucket: process.env.BUCKET_NAME,
    Body: file?.buffer,
    Key: filePath,
    ContentType: file?.mimetype,
  };

  try {
    const data = await s3.upload(uploadParams).promise();
    console.log(`File uploaded successfully. ${data.Location}`);

    // Trả về thẳng tên ảnh (không trả URL)
    return data.Key;
  } catch (err) {
    console.error("Error uploading file to AWS S3:", err);
    throw new Error("Upload file to AWS S3 failed");
  }
};

const deleteFile = async (fileKey) => {
    if (!fileKey) return;

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey
    };

    try {
        await s3.deleteObject(params).promise();
        
        console.log(`Xóa file cũ trên S3 thành công: ${fileKey}`);
    } catch (error) {
        console.error("Lỗi khi xóa file cũ trên S3:", error);
        // Không quăng lỗi (throw) ở đây để tránh làm gián đoạn luồng cập nhật sản phẩm
    }
};

module.exports = { uploadFile , deleteFile};
