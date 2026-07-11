const { Router } = require('express');
const { getHistory, getAnalytics, compareHistory, toggleFavorite, deleteHistory } = require('../controllers/history.controller');
const { authUser } = require('../middlewares/auth.middleware');

const historyRouter = Router();

// All history routes require authentication
historyRouter.use(authUser);

// @route   GET /api/history/analytics
// @desc    Get aggregated analytics for user's history
historyRouter.get('/analytics', getAnalytics);

// @route   GET /api/history/compare
// @desc    Compare two history analyses
historyRouter.get('/compare', compareHistory);

// @route   GET /api/history
// @desc    Get user's interview history with filtering, sorting, and pagination
historyRouter.get('/', getHistory);

// @route   PUT /api/history/:id/favorite
// @desc    Toggle favorite status
historyRouter.put('/:id/favorite', toggleFavorite);

// @route   DELETE /api/history/:id
// @desc    Delete a history record
historyRouter.delete('/:id', deleteHistory);

module.exports = historyRouter;
