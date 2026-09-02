import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "y3cwryo5";
const API_KEY = process.env.CLOUDINARY_API_KEY || "536262785818932";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "V4vNclaoiKkUnYvbVDHPmRoFTU0";

async function uploadToCloudinary(base64Data: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Cloudinary signature requires all parameters sent in alphabetical order: folder, timestamp
  const signStr = `folder=egycpm&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signStr).digest("hex");

  // Strip data URI prefix if present
  let imageData = base64Data;
  if (imageData.includes(",")) {
    imageData = imageData.split(",")[1];
  }

  const params = new URLSearchParams({
    file: `data:image/jpeg;base64,${imageData}`,
    api_key: API_KEY,
    timestamp,
    signature,
    folder: "egycpm",
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: params,
    }
  );

  const result = await response.json();
  if (!result.secure_url) {
    throw new Error(result.error?.message || "Cloudinary upload failed");
  }
  return result.secure_url;
}


export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "غير مصرح لك برفع الملفات." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "لم يتم تحديد أي ملف." }, { status: 400 });
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: "حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)." }, { status: 400 });
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ message: "صيغة الملف غير مدعومة." }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Upload to Cloudinary CDN
    const url = await uploadToCloudinary(base64);

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "فشل رفع الصورة: " + error.message }, { status: 500 });
  }
}
