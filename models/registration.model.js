const mongoose = require("mongoose")
const registration_schema = new mongoose.Schema({
    Event_ID:
    {
        type: String,
        required: true
    },
   registered:[{email:String}]
}
)
const collection = new mongoose.model("registrations", registration_schema)
module.exports = collection