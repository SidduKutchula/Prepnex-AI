const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getFallbackRoadmap } = require('../src/services/ai.service');

describe('Roadmap Generation Tests (1-30 Days)', () => {
    const jd = "Senior Full Stack Engineer. Requirements: Node.js, React, MongoDB, System Design, Microservices, Redis, AWS.";
    const profile = "Full stack developer with 3 years experience in JavaScript, React, Node.js, and SQL.";

    const testDays = [1, 2, 3, 5, 7, 10, 14, 21, 30];

    testDays.forEach(days => {
        it(`should generate valid, robust roadmap for ${days} days`, () => {
            const result = getFallbackRoadmap(jd, profile, days);
            assert.ok(result, 'Result should exist');
            assert.ok(Array.isArray(result.preparationPlan), 'preparationPlan should be an array');
            assert.equal(result.preparationPlan.length, days, `Plan length should match requested days (${days})`);

            result.preparationPlan.forEach((dayPlan, idx) => {
                assert.equal(dayPlan.day, idx + 1, `Day number should match index + 1 (${idx + 1})`);
                assert.ok(dayPlan.focus && dayPlan.focus.length > 0, `Day ${idx + 1} should have a focus topic`);
                assert.ok(!dayPlan.focus.toLowerCase().startsWith('day '), `Day ${idx + 1} focus should not duplicate 'Day X' prefix`);
                assert.ok(Array.isArray(dayPlan.tasks), `Day ${idx + 1} should have a tasks array`);
                assert.ok(dayPlan.tasks.length >= 1, `Day ${idx + 1} should have at least 1 task`);

                dayPlan.tasks.forEach(task => {
                    assert.ok(task.title, 'Task should have a title');
                    assert.ok(task.timeHours > 0, 'Task should have positive timeHours');
                    assert.ok(['Morning', 'Afternoon', 'Evening', 'Night'].includes(task.timeOfDay), 'Valid timeOfDay');
                    assert.ok(['Easy', 'Medium', 'Hard'].includes(task.difficulty), 'Valid difficulty');
                    assert.ok(['High', 'Medium', 'Low'].includes(task.priority), 'Valid priority');
                    assert.ok(task._id, 'Task should have an _id');
                });
            });
        });
    });

    it('should clamp out-of-range days safely', () => {
        // Less than 1 should clamp or handle safely
        const planNegative = getFallbackRoadmap(jd, profile, 0);
        assert.ok(planNegative.preparationPlan.length >= 1);

        // Greater than 30 should clamp safely
        const planHuge = getFallbackRoadmap(jd, profile, 45);
        assert.equal(planHuge.preparationPlan.length, 30);
    });
});
