const express = require('express');
const router = express.Router();
const autosaveController = require('../controllers/autosave.controller');
const { authUser } = require('../middlewares/auth.middleware');

router.post('/', authUser, autosaveController.saveAutosaveState);
router.get('/', authUser, autosaveController.getAutosaveState);
router.delete('/', authUser, autosaveController.clearAutosaveState);

module.exports = router;
