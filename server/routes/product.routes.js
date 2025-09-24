const router = require('express').Router();
const { list, show, create, remove, update } = require('../controllers/product.controller');
const auth = require('../utils/auth.middleware');
const isAdmin = require('../utils/admin.middleware');

router.get('/', list);
router.get('/:id', show);
router.post('/', auth, isAdmin, create);
router.patch('/:id', auth, isAdmin, update);
router.delete('/:id', auth, isAdmin, remove);

module.exports = router;
