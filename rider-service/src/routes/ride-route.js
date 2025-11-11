const express = require('express');
const { createRider, getRiders } = require('../controllers/ride-controller');

const router = express.Router();

router.post('/create', createRider);
router.get('/', getRiders);

module.exports = router;
