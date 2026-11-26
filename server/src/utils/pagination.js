const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_CATEGORIES = 10;

// Mengamankan karakter khusus LIKE (%, _, \) supaya pencarian "100%" dibaca apa adanya.
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

const toPositiveInt = (value) => {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return NaN;
  return Number(value.trim());
};

// Membaca query string daftar bahan: ?search=tepung&category=1,3&page=2&limit=10
// Mengembalikan { errors, query }. errors bernilai null bila semua valid.
const parseListQuery = (raw) => {
  const source = raw || {};
  const errors = {};

  let search = '';
  if (source.search !== undefined) {
    search = typeof source.search === 'string' ? source.search.trim() : '';
    if (typeof source.search !== 'string' || search.length > 100) {
      errors.search = 'Kata kunci maksimal 100 karakter';
    }
  }

  let page = 1;
  if (source.page !== undefined) {
    page = toPositiveInt(source.page);
    if (!Number.isInteger(page) || page < 1) errors.page = 'Halaman harus berupa angka bulat mulai dari 1';
  }

  let limit = DEFAULT_LIMIT;
  if (source.limit !== undefined) {
    limit = toPositiveInt(source.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      errors.limit = `Limit harus berupa angka bulat 1 sampai ${MAX_LIMIT}`;
    }
  }

  let categoryIds = [];
  if (source.category !== undefined && source.category !== '') {
    const parts = typeof source.category === 'string' ? source.category.split(',') : [];
    const ids = parts.map(toPositiveInt);
    if (
      parts.length === 0 ||
      parts.length > MAX_CATEGORIES ||
      ids.some((id) => !Number.isInteger(id) || id < 1 || id > 2147483647)
    ) {
      errors.category = 'Kategori harus berupa daftar angka dipisah koma (maksimal 10)';
    } else {
      categoryIds = [...new Set(ids)];
    }
  }

  if (Object.keys(errors).length > 0) return { errors, query: null };
  return { errors: null, query: { search, page, limit, categoryIds } };
};

module.exports = { parseListQuery, escapeLike, DEFAULT_LIMIT, MAX_LIMIT };