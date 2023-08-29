const mongoose = require("mongoose")

const feedback_schema = new mongoose.Schema({
    Event_ID:
    {
        type: String,
        required: true
    },
    feedback: [{ email: String, rating: { type: Number, minimum: 1, maximum: 10 }, comments: String }]
}
)
const collection = new mongoose.model("feedbacks", feedback_schema)
module.exports = collection