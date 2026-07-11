const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authUser } = require('../middlewares/auth.middleware');

router.post('/', authUser, activityController.logActivity);
router.get('/', authUser, activityController.getActivityHistory);

module.exports = router;
