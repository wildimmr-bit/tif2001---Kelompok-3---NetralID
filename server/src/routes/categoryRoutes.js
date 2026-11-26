const router = require('express').Router();
const verifyToken = require('../middlewares/verifyToken');
const controller = require('../controllers/categoryController');

router.use(verifyToken);
router.get('/', controller.list);

module.exports = router;