'use strict';

var controller = require('./medication.controller'),
    router = require('express').Router();

router.get('/', controller.index);
router.get('/find_one', controller.findOne);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
