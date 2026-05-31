import crypto from "node:crypto";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

export type RecipeImageUploadResult = {
  url?: string;
  error?: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "mesamate/recipes";

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder,
  };
}

function signUploadParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

export async function uploadRecipeImageFromFormData(
  formData: FormData,
  key = "image",
): Promise<RecipeImageUploadResult> {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return {};
  }

  if (!acceptedImageTypes.includes(value.type)) {
    return { error: "La foto debe ser JPG, PNG o WebP." };
  }

  if (value.size > maxImageSize) {
    return { error: "La foto no puede superar 5 MB." };
  }

  const config = getCloudinaryConfig();

  if (!config) {
    return { error: "Cloudinary no está configurado para subir fotos." };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    folder: config.folder,
    timestamp,
  };
  const uploadFormData = new FormData();
  const imageBuffer = await value.arrayBuffer();

  uploadFormData.append(
    "file",
    new Blob([imageBuffer], { type: value.type }),
    value.name || "recipe-photo",
  );
  uploadFormData.append("api_key", config.apiKey);
  uploadFormData.append("folder", config.folder);
  uploadFormData.append("timestamp", timestamp);
  uploadFormData.append("signature", signUploadParams(params, config.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body: uploadFormData,
    },
  );

  if (!response.ok) {
    return { error: "No se pudo subir la foto. Inténtalo de nuevo." };
  }

  const result = (await response.json()) as { secure_url?: unknown };

  if (typeof result.secure_url !== "string") {
    return { error: "No se pudo guardar la URL de la foto." };
  }

  return { url: result.secure_url };
}
