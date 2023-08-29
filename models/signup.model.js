const mongoose = require("mongoose")
const sign_up_schema = new mongoose.Schema({
    
    name:
    {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    organisation: {
        type: String,
        default: "N/A"
    }, profile_image: {
        data: String,
        contentType: String
    },
}
)
const collection = new mongoose.model("Users", sign_up_schema)
module.exports = collection