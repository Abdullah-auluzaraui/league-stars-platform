import { v2 as cloudinary } from 'cloudinary';

// تهيئة Cloudinary من متغيرات البيئة
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── رفع صورة ──
export async function uploadImage(
  file: string | Buffer,
  folder: 'teams' | 'players' | 'sponsors' | 'hero'
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/webp;base64,${file.toString('base64')}`,
    {
      folder: `league-stars/${folder}`,
      resource_type: 'image',
      transformation: [
        folder === 'teams'
          ? { width: 200, height: 200, crop: 'fill', gravity: 'auto', quality: 'auto' }
          : folder === 'players'
          ? { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }
          : { width: 800, height: 400, crop: 'fill', quality: 'auto' },
      ],
    }
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

// ── حذف صورة ──
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// ── رفع صورة من FormData (ملف) ──
export async function uploadFromFormData(
  file: File,
  folder: 'teams' | 'players' | 'sponsors' | 'hero'
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return uploadImage(buffer, folder);
}

export default cloudinary;
