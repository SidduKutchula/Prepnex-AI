const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Controller Code Quality & Authorization Audits', () => {
    it('enhanceResumeController must scope report query strictly by req.user.id', () => {
        const controllerFile = fs.readFileSync(
            path.join(__dirname, '../src/controllers/interview.controller.js'),
            'utf8'
        );
        // Ensure req.user._id is NOT used in enhanceResumeController
        assert.ok(!controllerFile.includes('user: req.user._id'), 'Should not contain user: req.user._id');
        assert.ok(controllerFile.includes('user: req.user.id'), 'Must query with user: req.user.id');
    });

    it('roadmap.controller must query RoadmapProgress schema using user and interviewReport fields', () => {
        const roadmapController = fs.readFileSync(
            path.join(__dirname, '../src/controllers/roadmap.controller.js'),
            'utf8'
        );
        assert.ok(!roadmapController.includes('userId:'), 'Should not query with non-existent userId field');
        assert.ok(!roadmapController.includes('reportId:'), 'Should not query with non-existent reportId field');
        assert.ok(roadmapController.includes('user: userId'), 'Should query with user field');
        assert.ok(roadmapController.includes('interviewReport: reportId'), 'Should query with interviewReport field');
        assert.ok(roadmapController.includes("status: 'completed'"), 'Should filter with status: completed');
    });

    it('activity.controller must use req.user.id instead of req.user._id', () => {
        const activityController = fs.readFileSync(
            path.join(__dirname, '../src/controllers/activity.controller.js'),
            'utf8'
        );
        assert.ok(!activityController.includes('req.user._id'), 'Should not use req.user._id');
        assert.ok(activityController.includes('req.user.id'), 'Must use req.user.id');
    });

    it('history.controller compareHistory must enforce user ownership to prevent IDOR', () => {
        const historyController = fs.readFileSync(
            path.join(__dirname, '../src/controllers/history.controller.js'),
            'utf8'
        );
        assert.ok(historyController.includes('_id: id1, user: userId'), 'Must scope report1 by user');
        assert.ok(historyController.includes('_id: id2, user: userId'), 'Must scope report2 by user');
    });

    it('chat.routes.js must require checkUser middleware and extract req.user?.id', () => {
        const chatRoutes = fs.readFileSync(
            path.join(__dirname, '../src/routes/chat.routes.js'),
            'utf8'
        );
        assert.ok(chatRoutes.includes('checkUser'), 'Must mount checkUser middleware');
        assert.ok(chatRoutes.includes('req.user?.id'), 'Must read req.user?.id');
        assert.ok(!chatRoutes.includes('decoded._id'), 'Should not read non-existent decoded._id');
    });

    it('RoadmapProgress schema must support dual-aliases user/userId and interviewReport/reportId', () => {
        const RoadmapProgress = require('../src/models/roadmapProgress.model');
        const paths = Object.keys(RoadmapProgress.schema.paths);
        assert.ok(paths.includes('user'), 'Must have user path');
        assert.ok(paths.includes('userId'), 'Must have userId path');
        assert.ok(paths.includes('interviewReport'), 'Must have interviewReport path');
        assert.ok(paths.includes('reportId'), 'Must have reportId path');
        assert.ok(paths.includes('status'), 'Must have status path');
        assert.ok(paths.includes('completed'), 'Must have completed path');
    });
});
