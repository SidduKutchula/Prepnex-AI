const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const roadmapController = require('../controllers/roadmap.controller');

router.get('/progress/:reportId', authMiddleware.authUser, roadmapController.getProgress);
router.patch('/progress/:reportId/task/:taskId', authMiddleware.authUser, roadmapController.toggleTask);

module.exports = router;
