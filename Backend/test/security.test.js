const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Test 1: Multer PDF filter
const upload = require('../src/middlewares/file.middleware');

describe('Security Hardening Tests', () => {
    describe('File Upload Security Filter', () => {
        const fileFilter = upload.fileFilter;

        it('should allow valid PDF file and mime type', (t, done) => {
            const req = {};
            const file = { originalname: 'resume.pdf', mimetype: 'application/pdf' };
            fileFilter(req, file, (err, accept) => {
                assert.equal(err, null);
                assert.equal(accept, true);
                done();
            });
        });

        it('should reject executable files (.exe)', (t, done) => {
            const req = {};
            const file = { originalname: 'malware.exe', mimetype: 'application/octet-stream' };
            fileFilter(req, file, (err, accept) => {
                assert.ok(err instanceof Error);
                assert.match(err.message, /Only PDF files are allowed/);
                assert.equal(accept, false);
                done();
            });
        });

        it('should reject script files (.js) even if MIME is spoofed', (t, done) => {
            const req = {};
            const file = { originalname: 'exploit.js', mimetype: 'application/pdf' };
            fileFilter(req, file, (err, accept) => {
                assert.ok(err instanceof Error);
                assert.match(err.message, /Only PDF files are allowed/);
                done();
            });
        });

        it('should reject non-PDF MIME type even if extension is .pdf', (t, done) => {
            const req = {};
            const file = { originalname: 'fake.pdf', mimetype: 'text/html' };
            fileFilter(req, file, (err, accept) => {
                assert.ok(err instanceof Error);
                assert.match(err.message, /Only PDF files are allowed/);
                done();
            });
        });
    });

    describe('JWT Algorithm Restriction', () => {
        const secret = 'test-secret-key-12345';

        it('should verify valid token signed with HS256', () => {
            const payload = { id: 'user_123', email: 'test@example.com' };
            const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h' });
            const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
            assert.equal(decoded.id, 'user_123');
            assert.equal(decoded.email, 'test@example.com');
        });

        it('should reject tokens with mismatched algorithm', () => {
            const payload = { id: 'user_123' };
            const token = jwt.sign(payload, secret, { algorithm: 'HS384', expiresIn: '1h' });
            assert.throws(() => {
                jwt.verify(token, secret, { algorithms: ['HS256'] });
            }, /invalid algorithm/);
        });
    });

    describe('Database Security Indexes', () => {
        it('blacklist model should have a 7-day TTL index on createdAt', () => {
            const blacklistModel = require('../src/models/blacklist.model');
            const indexes = blacklistModel.schema.indexes();
            const ttlIndex = indexes.find(idx => idx[0].createdAt === 1 && idx[1]?.expireAfterSeconds === 604800);
            assert.ok(ttlIndex, 'Expected TTL index on createdAt with expireAfterSeconds: 604800');
        });

        it('interviewReport model should have index on user and compound index on user + createdAt', () => {
            const reportModel = require('../src/models/interviewReport.model');
            const indexes = reportModel.schema.indexes();
            const userIndex = indexes.find(idx => idx[0].user === 1 && !idx[0].createdAt);
            const compoundIndex = indexes.find(idx => idx[0].user === 1 && idx[0].createdAt === -1);
            assert.ok(userIndex, 'Expected index on user');
            assert.ok(compoundIndex, 'Expected compound index on { user: 1, createdAt: -1 }');
        });
    });
});
