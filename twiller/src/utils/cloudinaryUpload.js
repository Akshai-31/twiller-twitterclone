// COMMON Cloudinary Upload Utility (Images / Video / Audio)
const CLOUDINARY_UPLOAD_PRESET = "twitter-mern";
const CLOUDINARY_CLOUD_NAME = "devksymwg";

export const uploadMediaToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data;  // ⭐ return whole response (url, public_id, type)
  } catch (error) {
    console.error("Cloudinary Upload Failed:", error);
    return null;
  }
};
