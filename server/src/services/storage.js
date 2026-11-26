// Penyimpanan gambar di cloud (Supabase Storage). Hanya berkas ini yang tahu penyedia storage:
// jika tim memakai Cloudinary, cukup ganti isi berkas ini dengan fungsi yang sama.
//
// Variabel lingkungan: SUPABASE_URL, SUPABASE_SERVICE_KEY (rahasia, hanya di server), SUPABASE_BUCKET.

let client;

const bucketName = () => process.env.SUPABASE_BUCKET || 'ingredient-images';

const getClient = () => {
  if (!client) {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return client;
};

// Mengubah alamat publik menjadi path di dalam bucket. Mengembalikan null bila bukan alamat bucket ini.
const pathFromPublicUrl = (url) => {
  if (typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${bucketName()}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
};

// Mengunggah buffer dan mengembalikan alamat publik berkas.
const uploadImage = async ({ buffer, contentType, path }) => {
  const bucket = getClient().storage.from(bucketName());
  const { error } = await bucket.upload(path, buffer, { contentType, upsert: false });
  if (error) throw new Error('Gagal mengunggah gambar ke penyimpanan');
  return bucket.getPublicUrl(path).data.publicUrl;
};

// Menghapus berkas berdasarkan alamat publiknya. Tidak melempar galat bila alamatnya tidak dikenal.
const removeByUrl = async (url) => {
  const path = pathFromPublicUrl(url);
  if (!path) return;
  const { error } = await getClient().storage.from(bucketName()).remove([path]);
  if (error) throw new Error('Gagal menghapus gambar dari penyimpanan');
};

module.exports = { uploadImage, removeByUrl, pathFromPublicUrl };