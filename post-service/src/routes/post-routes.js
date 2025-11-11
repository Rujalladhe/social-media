const express = require('express');

const { createpost, getAllPosts, getPost, deletepost } = require('../controllers/post-controller');
const { authenticateRequest } = require('../middleware/authMiddleare');
const router = express();
router.use(authenticateRequest);
router.post('/create-post', createpost);
router.get('/getPosts', getAllPosts);
router.get('/:id', getPost);
router.delete('/:id', deletepost);

module.exports = router;
