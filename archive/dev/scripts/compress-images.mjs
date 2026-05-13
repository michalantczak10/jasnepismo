import { fileURLToPath } from 'url';
import { dirname, extname, join } from 'path';
import { readdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const imgDir = join(projectRoot, 'img');

const dirs = ['products', 'team', 'hero', 'branding'];

// Compression settings
const JPEG_QUALITY = 75;
const PNG_COMPRESSION_LEVEL = 9;
const WEBP_QUALITY = 75;

async function collectImages(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(fullPath)));
      continue;
    }

    if (!entry.isFile()) continue;
    const extension = extname(entry.name).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg' || extension === '.png') {
      files.push(fullPath);
    }
  }

  return files;
}

try {
  console.log('🎨 Starting image compression with WebP generation...\n');
  let totalCompressed = 0;
  let totalWebp = 0;
  
  for (const dir of dirs) {
    const dirPath = join(imgDir, dir);
    console.log(`📁 Processing ${dir}...`);

    const files = await collectImages(dirPath);
    let compressedInDir = 0;
    let webpInDir = 0;

    for (const filePath of files) {
      const extension = extname(filePath).toLowerCase();
      const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      try {
        // Compress original image
        if (extension === '.jpg' || extension === '.jpeg') {
          const jpegBuffer = await sharp(filePath)
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer();
          await writeFile(filePath, jpegBuffer);
          compressedInDir += 1;
        }

        if (extension === '.png') {
          const pngBuffer = await sharp(filePath)
            .png({ compressionLevel: PNG_COMPRESSION_LEVEL, palette: true })
            .toBuffer();
          await writeFile(filePath, pngBuffer);
          compressedInDir += 1;
        }

        // Generate WebP only if it doesn't exist
        if (!existsSync(webpPath)) {
          await sharp(filePath).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
          webpInDir += 1;
        }
      } catch (fileError) {
        console.warn(`   ⚠️  Failed to process ${filePath}: ${fileError.message}`);
      }
    }

    totalCompressed += compressedInDir;
    totalWebp += webpInDir;
    console.log(`   ✓ ${compressedInDir} images compressed, ${webpInDir} WebP generated`);
  }

  console.log(`\n✅ Compression completed!`);
  console.log(`📦 Total: ${totalCompressed} PNG/JPG compressed, ${totalWebp} WebP generated\n`);
} catch (error) {
  console.error('❌ Compression failed:', error.message);
  process.exit(1);
}
