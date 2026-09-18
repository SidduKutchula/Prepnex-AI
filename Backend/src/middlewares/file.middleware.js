const multer = require("multer")
const path = require("path")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedMimes.includes(file.mimetype) && ext === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'), false);
        }
    }
})


module.exports = upload