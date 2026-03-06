import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const out = path.resolve(process.cwd(), 'test-assets');
if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

function download(url: string, dest: string, redirects = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).toString();
          res.resume();
          return resolve(download(next, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Request Failed. Status Code: ${res.statusCode} for ${url}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
        file.on('error', (err) => reject(err));
        1;
      })
      .on('error', (err) => reject(err));
  });
}

(async () => {
  try {
    const images = [
      { name: 'photo-small.jpg', width: 1600, height: 1200, seed: 'small' },
      { name: 'photo-1.jpg', width: 1600, height: 1200, seed: '1' },
      { name: 'photo-2.jpg', width: 1600, height: 1200, seed: '2' },
      { name: 'photo-3.jpg', width: 1600, height: 1200, seed: '3' },
      { name: 'photo-4.jpg', width: 1600, height: 1200, seed: '4' },
    ];

    const tasks = images.map((img) => {
      const url = `https://picsum.photos/seed/${encodeURIComponent(img.seed)}/${img.width}/${img.height}`;
      const dest = path.join(out, img.name);
      console.log('Downloading', url, '->', dest);
      return download(url, dest).then(() => console.log('Saved', dest));
    });

    await Promise.all(tasks);
    console.log('All test images downloaded into', out);
  } catch (err) {
    console.error('Error downloading images:', err);
    process.exitCode = 1;
  }
})();
