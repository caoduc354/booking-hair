import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';

export const downloadImage = async (url, fileName) => {
  try {
    // Tạo đường dẫn đầy đủ tới thư mục public/images
    const filePath = path.resolve('./public/images', fileName);

    // Tải ảnh bằng axios
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    });

    // Tạo một stream ghi vào file
    const writer = fs.createWriteStream(filePath);

    // Sử dụng stream để ghi dữ liệu từ response vào file
    response.data.pipe(writer);

    // Đợi cho đến khi tải xong và ghi vào file
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`Image saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error downloading the image:', error);
    throw error;
  }
};
