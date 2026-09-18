const mongoose = require("mongoose")



async function connectToDB() {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/interview-ai";
    const connectionOptions = {
        serverSelectionTimeoutMS: 10000, // Fail fast if MongoDB is unreachable
        socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
    };
    try {
        await mongoose.connect(mongoUri, connectionOptions);
        console.log("Connected to Database:", mongoUri);
    } catch (err) {
        console.error("Failed to connect to Database at", mongoUri, ":", err.message);
        if (mongoUri !== "mongodb://127.0.0.1:27017/interview-ai") {
            console.log("Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/interview-ai)...");
            await mongoose.connect("mongodb://127.0.0.1:27017/interview-ai", connectionOptions);
            console.log("Connected to local Database fallback");
            return;
        }
        throw err;
    }
}

module.exports = connectToDB