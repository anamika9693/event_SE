const mongoose = require("mongoose")
const registration_schema = new mongoose.Schema({
   Email:
    {
        type: String,
        required: true
    },
   events:[{events:String}]
}
)
const collection = new mongoose.model("individual registrations", registration_schema)
module.exports = collection