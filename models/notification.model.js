const mongoose = require("mongoose")
const notification_schema = new mongoose.Schema({
    email: {
        type: String
    },
    Events: {
        type: {}
    },
    waitlist: []
}
)
const collection = new mongoose.model("notification", notification_schema)
module.exports = collection