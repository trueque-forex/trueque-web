import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.KYC_UPLOAD_DIR || path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export async function saveFile(buffer: Buffer, originalName: string) {
  const id = uuidv4();
  const ext = path.extname(originalName) || '';
  const filename = `${id}${ext}`;
  const dest = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(dest, buffer);
  // return URL-friendly path for dev; in production return S3 URL
  return { id, path: dest, url: `/uploads/${filename}` };
}
