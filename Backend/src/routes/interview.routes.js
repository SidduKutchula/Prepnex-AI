const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/parse", authMiddleware.authUser, upload.single("resume"), interviewController.parseResumeController)
interviewRouter.post("/ats-gaps", authMiddleware.authUser, interviewController.generateAtsGapsController)
interviewRouter.post("/questions", authMiddleware.authUser, interviewController.generateQuestionsController)
interviewRouter.post("/roadmap", authMiddleware.authUser, interviewController.generateRoadmapController)
interviewRouter.post("/resume-rewrite", authMiddleware.authUser, interviewController.generateResumeRewriteController)
interviewRouter.post("/start", authMiddleware.authUser, interviewController.startInterviewReportController)
interviewRouter.get("/stream/:interviewId", authMiddleware.authUser, interviewController.streamProgressController)

interviewRouter.post("/save", authMiddleware.authUser, interviewController.saveInterviewReportController)
/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)






interviewRouter.put("/:interviewId/bookmark", authMiddleware.authUser, interviewController.toggleBookmarkController)
interviewRouter.delete("/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController)
interviewRouter.put("/:interviewId/rename", authMiddleware.authUser, interviewController.renameInterviewReportController)
interviewRouter.put("/:interviewId/task/:taskId/toggle", authMiddleware.authUser, interviewController.toggleTaskCompletionController)
interviewRouter.post("/sync-progress", authMiddleware.authUser, interviewController.syncProgressController)
interviewRouter.get("/analytics/dashboard", authMiddleware.authUser, interviewController.getDashboardAnalyticsController)
interviewRouter.delete("/:interviewId/roadmap/reset", authMiddleware.authUser, interviewController.resetRoadmapProgressController)

module.exports = interviewRouter