import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomToken } from "@/lib/crypto";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const RESUME_TYPES = new Set(["application/pdf"]);

export async function saveUpload(file: File, folder: "avatars" | "resumes" | "events" | "clubs" | "certificates") {
  const isResume = folder === "resumes";
  const allowed = isResume ? RESUME_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) {
    throw new Error(isResume ? "Upload a PDF resume." : "Upload a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be 5 MB or smaller.");
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "pdf";
  const filename = `${randomToken(12)}.${extension}`;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  const bytes = Buffer.from(await file.arrayBuffer());

  if (driver === "local") {
    const directory = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), bytes);
    return `/uploads/${folder}/${filename}`;
  }

  if (driver === "s3") {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const publicBase = process.env.S3_PUBLIC_URL;
    if (!bucket || !region || !publicBase || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage is selected but the bucket credentials are incomplete.");
    }
    let S3Client: new (config: unknown) => { send: (command: unknown) => Promise<unknown> };
    let PutObjectCommand: new (input: unknown) => unknown;
    try {
      const loadModule = new Function("moduleName", "return import(moduleName)") as (moduleName: string) => Promise<{
        S3Client: new (config: unknown) => { send: (command: unknown) => Promise<unknown> };
        PutObjectCommand: new (input: unknown) => unknown;
      }>;
      const sdk = await loadModule("@aws-sdk/" + "client-s3");
      S3Client = sdk.S3Client;
      PutObjectCommand = sdk.PutObjectCommand;
    } catch {
      throw new Error("Install @aws-sdk/client-s3 to use S3 storage.");
    }
    const client = new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    });
    const key = `${folder}/${filename}`;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: file.type }));
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }

  throw new Error(`Unknown storage driver: ${driver}`);
}
