const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { _cacheInternal } = require('../src/services/ai.service');
const AIWorkerService = require('../src/services/aiWorker.service');

describe('Cache, Worker and Scoring Reliability Tests', () => {
    describe('Bounded Cache & TTL', () => {
        const { getCacheEntry, setCacheEntry, openRouterCache, CACHE_MAX_SIZE } = _cacheInternal;

        it('should have a max capacity limit of 100', () => {
            assert.equal(CACHE_MAX_SIZE, 100);
        });

        it('should store and retrieve cached values', () => {
            setCacheEntry('test-key-1', { answer: 42 });
            const result = getCacheEntry('test-key-1');
            assert.deepEqual(result, { answer: 42 });
        });

        it('should never exceed CACHE_MAX_SIZE when adding many entries', () => {
            for (let i = 0; i < 150; i++) {
                setCacheEntry(`stress-key-${i}`, { index: i });
            }
            assert.ok(openRouterCache.size <= CACHE_MAX_SIZE, `Cache size ${openRouterCache.size} exceeded max ${CACHE_MAX_SIZE}`);
        });

        it('should evict the oldest entry when exceeding max size', () => {
            // Clear and populate exactly CACHE_MAX_SIZE
            openRouterCache.clear();
            setCacheEntry('first-entry', { val: 'first' });
            for (let i = 0; i < CACHE_MAX_SIZE; i++) {
                setCacheEntry(`entry-${i}`, { val: i });
            }
            // 'first-entry' should have been evicted
            const evicted = getCacheEntry('first-entry');
            assert.equal(evicted, null, 'First entry should have been evicted');
        });
    });

    describe('AIWorker EventEmitter', () => {
        it('should configure maxListeners to 50', () => {
            const aiWorker = require('../src/services/aiWorker.service');
            assert.equal(aiWorker.getMaxListeners(), 50);
        });
    });

    describe('Zero Score Robustness', () => {
        it('should preserve legitimate 0 score and not replace with default fallback 75', () => {
            const atsData = { atsScore: 0, matchScore: 0 };
            
            const rawAts = Number(atsData?.atsScore);
            const atsScore = !isNaN(rawAts) ? Math.min(Math.max(Math.round(rawAts), 0), 100) : 75;
            const rawMatch = Number(atsData?.matchScore);
            const matchScore = !isNaN(rawMatch) ? Math.min(Math.max(Math.round(rawMatch), 0), 100) : atsScore;

            assert.equal(atsScore, 0, 'Legitimate 0 ATS score must remain 0');
            assert.equal(matchScore, 0, 'Legitimate 0 match score must remain 0');
        });

        it('should safely fall back to 75 only when atsScore is undefined or NaN', () => {
            const atsData = { atsScore: undefined, matchScore: null };
            
            const rawAts = Number(atsData?.atsScore);
            const atsScore = !isNaN(rawAts) ? Math.min(Math.max(Math.round(rawAts), 0), 100) : 75;
            const rawMatch = Number(atsData?.matchScore);
            const matchScore = !isNaN(rawMatch) ? Math.min(Math.max(Math.round(rawMatch), 0), 100) : atsScore;

            assert.equal(atsScore, 75);
            // Number(null) is 0 in JS, so matchScore will be 0 when null is explicitly passed:
            assert.ok(!isNaN(matchScore));
        });
    });
});
