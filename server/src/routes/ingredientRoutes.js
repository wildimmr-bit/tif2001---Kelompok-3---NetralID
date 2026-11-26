const router = require('express').Router();
const verifyToken = require('../middlewares/verifyToken');
const uploadImage = require('../middlewares/uploadImage');
const controller = require('../controllers/ingredientController');

// Semua route bahan wajib memakai token. Data selalu disaring berdasarkan pengguna yang login.
router.use(verifyToken);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id/history', controller.history);
router.post('/:id/image', uploadImage, controller.uploadImage);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;7