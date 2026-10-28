import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/icons', { recursive: true });
for (const size of [192, 512]) {
  await sharp('public/icons/icon.svg').resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
await sharp('public/icons/icon.svg').resize(180, 180).png().toFile('public/icons/apple-touch-icon.png');
const maskable = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2563eb"/><path d="M166 260 L230 324 L346 194" fill="none" stroke="white" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/></svg>');
await sharp(maskable).png().toFile('public/icons/maskable-512.png');
console.log('TaskFlow PWA icons generated.');
