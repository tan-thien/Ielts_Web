type CloudinaryResourceType = "Image" | "Audio" | "Video" | "PDF";

interface CloudinaryUploadResponse {
    secure_url?: string;
    error?: {
        message?: string;
    };
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadCloudinaryResource(
    file: File,
    resourceType: CloudinaryResourceType,
): Promise<string> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
            "Chưa cấu hình Cloudinary. Vui lòng thiết lập VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET trong file .env.",
        );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const validFileType = resourceType === "Image"
        ? file.type.startsWith("image/")
        : resourceType === "Audio"
            ? file.type.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg"].includes(extension)
            : resourceType === "Video"
                ? file.type.startsWith("video/")
                : file.type === "application/pdf" || extension === "pdf";
    if (!validFileType) {
        throw new Error(`File không đúng định dạng ${resourceType}.`);
    }

    const endpointType = resourceType === "Image"
        ? "image"
        : resourceType === "PDF"
            ? "raw"
            : "video";
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpointType}/upload`,
        { method: "POST", body: uploadData },
    );
    const result = await response.json() as CloudinaryUploadResponse;

    if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "Không thể tải tài liệu lên Cloudinary.");
    }

    return result.secure_url;
}
