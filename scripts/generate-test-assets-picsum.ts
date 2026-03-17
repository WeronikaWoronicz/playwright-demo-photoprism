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

    const perTestImages = [
      { subdir: 'upload-single', name: 'single-upload.jpg', width: 1600, height: 1200, seed: 'upl-single-1' },
      { subdir: 'upload-multiple', name: 'multi-upload-1.jpg', width: 1600, height: 1200, seed: 'upl-multi-1' },
      { subdir: 'upload-multiple', name: 'multi-upload-2.jpg', width: 1600, height: 1200, seed: 'upl-multi-2' },
      { subdir: 'upload-multiple', name: 'multi-upload-3.jpg', width: 1600, height: 1200, seed: 'upl-multi-3' },
      { subdir: 'upload-large', name: 'large-network-abort.jpg', width: 1600, height: 1200, seed: 'upl-large-1' },
      { subdir: 'image-ops', name: 'rotate-target.jpg', width: 1600, height: 1200, seed: 'img-ops-1' },
      { subdir: 'metadata-edit', name: 'title-edit-target.jpg', width: 1600, height: 1200, seed: 'meta-edit-1' },
      { subdir: 'delete-undo', name: 'delete-target.jpg', width: 1600, height: 1200, seed: 'del-undo-1' },
      { subdir: 'browse-filter-sort', name: 'sort-photo-older.jpg', width: 1600, height: 1200, seed: 'browse-1' },
      { subdir: 'browse-filter-sort', name: 'sort-photo-newer.jpg', width: 1600, height: 1200, seed: 'browse-2' },
      { subdir: 'search', name: 'search-target.jpg', width: 1600, height: 1200, seed: 'search-1' },
      { subdir: 'share-link', name: 'share-link-photo.jpg', width: 1600, height: 1200, seed: 'share-1' },
      { subdir: 'concurrent-edits', name: 'concurrent-title-edit.jpg', width: 1600, height: 1200, seed: 'conc-edit-1' },
      { subdir: 'album-crud', name: 'album-add-photo.jpg', width: 1600, height: 1200, seed: 'album-crud-1' },
    ];

    const tasks = images.map((img) => {
      const url = `https://picsum.photos/seed/${encodeURIComponent(img.seed)}/${img.width}/${img.height}`;
      const dest = path.join(out, img.name);
      console.log('Downloading', url, '->', dest);
      return download(url, dest).then(() => console.log('Saved', dest));
    });

    const perTestTasks = perTestImages.map((img) => {
      const subOut = path.join(out, img.subdir);
      if (!fs.existsSync(subOut)) fs.mkdirSync(subOut, { recursive: true });
      const url = `https://picsum.photos/seed/${encodeURIComponent(img.seed)}/${img.width}/${img.height}`;
      const dest = path.join(subOut, img.name);
      console.log('Downloading', url, '->', dest);
      return download(url, dest).then(() => console.log('Saved', dest));
    });

    await Promise.all([...tasks, ...perTestTasks]);
    console.log('All test images downloaded into', out);
  } catch (err) {
    console.error('Error downloading images:', err);
    process.exitCode = 1;
  }
})();
