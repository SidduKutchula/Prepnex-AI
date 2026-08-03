const mongoose = require("mongoose")



async function connectToDB() {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/interview-ai";
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected to Database:", mongoUri);
    } catch (err) {
        console.error("Failed to connect to Database at", mongoUri, ":", err.message);
        if (mongoUri !== "mongodb://127.0.0.1:27017/interview-ai") {
            console.log("Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/interview-ai)...");
            await mongoose.connect("mongodb://127.0.0.1:27017/interview-ai");
            console.log("Connected to local Database fallback");
            return;
        }
        throw err;
    }
}

module.exports = connectToDB