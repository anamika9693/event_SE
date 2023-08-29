const mongoose = require("mongoose")

const feedback_schema = new mongoose.Schema({
    email: String,
    name: String,
    feedback: String
}
)
const collection = new mongoose.model("app_feedbacks", feedback_schema)
module.exports = collection