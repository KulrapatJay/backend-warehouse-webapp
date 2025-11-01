const supabase = require('../config/supabase');
const path = require('path');

class StorageService {
  constructor() {
    this.bucketName = 'product-images';
  }

  /**
   * อัปโหลดรูปภาพไป Supabase Storage
   * @param {Buffer} fileBuffer - ไฟล์จาก multer (req.file.buffer)
   * @param {string} originalName - ชื่อไฟล์เดิม (req.file.originalname)
   * @param {string} mimetype - MIME type ของไฟล์ (req.file.mimetype)
   * @returns {Promise<string>} - URL ของรูปภาพ
   */
  async uploadImage(fileBuffer, originalName, mimetype) {
    try {
      const fileExt = path.extname(originalName);
      const fileName = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('Uploading image:', filePath);
      console.log('MIME type:', mimetype);
      console.log('File size:', fileBuffer.length, 'bytes');

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType: mimetype || 'image/jpeg', // ใช้ mimetype จริงจากไฟล์
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      console.log('Upload successful:', data);

      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      console.log('Image URL:', imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  /**
   * ลบรูปภาพจาก Supabase Storage
   * @param {string} imageUrl - URL ของรูปภาพที่ต้องการลบ
   */
  async deleteImage(imageUrl) {
    try {
      if (!imageUrl) {
        console.log('No image URL provided, skipping delete');
        return;
      }

      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.indexOf('product-images');
      
      if (bucketIndex === -1) {
        console.log('Invalid image URL format');
        return;
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      console.log('Deleting image:', filePath);

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
      }

      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Delete image error:', error);
    }
  }

  /**
   * อัปเดตรูปภาพ (ลบรูปเก่า อัปโหลดรูปใหม่)
   * @param {string} oldImageUrl - URL รูปเก่า
   * @param {Buffer} fileBuffer - ไฟล์ใหม่
   * @param {string} originalName - ชื่อไฟล์ใหม่
   * @param {string} mimetype - MIME type ของไฟล์
   * @returns {Promise<string>} - URL ของรูปใหม่
   */
  async updateImage(oldImageUrl, fileBuffer, originalName, mimetype) {
    try {
      console.log('Updating image...');
      
      if (oldImageUrl) {
        await this.deleteImage(oldImageUrl);
      }

      const newImageUrl = await this.uploadImage(fileBuffer, originalName, mimetype);
      
      console.log('Image updated successfully');
      return newImageUrl;
    } catch (error) {
      console.error('Update image error:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();