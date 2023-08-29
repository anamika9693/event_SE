const mongoose = require("mongoose")
const events = new mongoose.Schema({
    email:
    {
        type: String,
        required: true
    },
    event_name: {
        type: String,
        required: true
    },
    date: {
        registration: {
            type: Date,
        },
        event_date: {
            type: Date,
            required: true
        }
    },
    time: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    contact: {
        type: {},
        required: true
    },
    requirements: {
        type: {}
    },
    fees: {
        type: Number,
        required: true
    },
    scope: {
        scope: {
            type: String,
            required: true
        },
        code: {
            type: String,
            default: "PUBLIC"
        }
    },
    max_limit: {
        type: Number,
        default: 1000000000
    },
    total_registrations: {
        type: Number,
        default: 0
    },
    image:
    {
        data: String,
        contentType: String
    }

}

)
const collection2 = new mongoose.model("Events", events)
module.exports = collection2