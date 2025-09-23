const router = require('express').Router();
const { list, create, remove } = require('../controllers/product.controller');
const auth = require('../utils/auth.middleware');
const isAdmin = require('../utils/admin.middleware');

router.get('/', list);
router.post('/', auth, isAdmin, create);
router.delete('/:id', auth, isAdmin, remove);

module.exports = router;
