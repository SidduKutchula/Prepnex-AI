const InterviewReport = require("../models/interviewReport.model");
const asyncHandler = require("../utils/asyncHandler");

// @route   GET /api/history
// @desc    Get user's interview history with filtering, sorting, and pagination
exports.getHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { 
        page = 1, 
        limit = 10, 
        search, 
        filter, 
        sort 
    } = req.query;

    const query = { user: userId };

    // Search by company, role, or technologies
    if (search) {
        query.$or = [
            { company: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
            { jobDescription: { $regex: search, $options: "i" } }
        ];
    }

    // Apply filters
    if (filter === "completed") query.status = "completed";
    if (filter === "preparing") query.status = "draft";
    if (filter === "favorites") query.favorite = true;
    if (filter === "high-ats") query.atsScore = { $gte: 80 };
    if (filter === "low-ats") query.atsScore = { $lt: 80 };
    // Upcoming interviews: interviewDate > today
    if (filter === "upcoming") {
        query.interviewDate = { $gte: new Date() };
    }
    // Expired: interviewDate < today
    if (filter === "expired") {
        query.interviewDate = { $lt: new Date() };
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default Newest
    if (sort === "oldest") sortObj = { createdAt: 1 };
    if (sort === "highest-ats") sortObj = { atsScore: -1 };
    if (sort === "lowest-ats") sortObj = { atsScore: 1 };
    if (sort === "upcoming") sortObj = { interviewDate: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await InterviewReport.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-technicalQuestions -behavioralQuestions -preparationPlan -rewrittenResumeHtml"); // Exclude heavy text fields for list view

    const total = await InterviewReport.countDocuments(query);

    res.status(200).json({
        success: true,
        data: history,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    });
});

// @route   GET /api/history/analytics
// @desc    Get aggregated analytics for user's history
exports.getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const reports = await InterviewReport.find({ user: userId });

    const totalInterviews = reports.length;
    const completed = reports.filter(r => r.status === "completed").length;
    const preparing = reports.filter(r => r.status === "draft").length;

    const avgAts = reports.length > 0 
        ? (reports.reduce((acc, curr) => acc + (curr.atsScore || 0), 0) / reports.length).toFixed(1) 
        : 0;

    const avgMatch = reports.length > 0 
        ? (reports.reduce((acc, curr) => acc + (curr.matchScore || 0), 0) / reports.length).toFixed(1) 
        : 0;

    res.status(200).json({
        success: true,
        data: {
            totalInterviews,
            completed,
            preparing,
            avgAts: parseFloat(avgAts),
            avgMatch: parseFloat(avgMatch)
        }
    });
});

// @route   GET /api/history/compare
// @desc    Compare two history analyses
exports.compareHistory = asyncHandler(async (req, res) => {
    const { id1, id2 } = req.query;

    const report1 = await InterviewReport.findById(id1);
    const report2 = await InterviewReport.findById(id2);

    if (!report1 || !report2) {
        return res.status(404).json({ success: false, message: "One or both reports not found" });
    }

    const atsDiff = (report2.atsScore || 0) - (report1.atsScore || 0);
    const matchDiff = (report2.matchScore || 0) - (report1.matchScore || 0);

    const skills1 = report1.skillGaps ? report1.skillGaps.map(s => s.skill) : [];
    const skills2 = report2.skillGaps ? report2.skillGaps.map(s => s.skill) : [];

    const newSkillsGaps = skills2.filter(s => !skills1.includes(s));
    const resolvedSkillsGaps = skills1.filter(s => !skills2.includes(s));

    res.status(200).json({
        success: true,
        data: {
            report1,
            report2,
            comparison: {
                atsDiff,
                matchDiff,
                newSkillsGaps,
                resolvedSkillsGaps
            }
        }
    });
});

// @route   PUT /api/history/:id/favorite
// @desc    Toggle favorite status
exports.toggleFavorite = asyncHandler(async (req, res) => {
    const report = await InterviewReport.findById(req.params.id);
    
    if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (report.user.toString() !== req.user.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    report.favorite = !report.favorite;
    await report.save();

    res.status(200).json({ success: true, data: report });
});

// @route   DELETE /api/history/:id
// @desc    Delete a history record
exports.deleteHistory = asyncHandler(async (req, res) => {
    const report = await InterviewReport.findById(req.params.id);
    
    if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (report.user.toString() !== req.user.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await report.deleteOne();

    res.status(200).json({ success: true, message: "Report deleted" });
});
