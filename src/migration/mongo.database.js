const mongoose = require("mongoose");
const moment = require("moment");

const config = require("../config/config.js")
// console.log("🚀 ~ config:", config)
const common = require("../services/common.service.js")
//connect to database
mongoose.connect(
    // common.decryption(config.database_connection),
    config.database_connection,
)
    .then(() => console.log("database successfully connected!"))
    .catch((error) => console.log(error.message));

//connection events

//when successfully connected
mongoose.connection.on("connected", () => console.log("mongoose default connection open to Date", moment().format('MMMM Do YYYY, hh:mm:ss a')));

//if the connection throws an error
mongoose.connection.on("error", (error) => console.log("mongoose default connection error", error.message));

//if the connection disconnected
mongoose.connection.on("disconnected", (error) => console.log("mongoose default connection disconnected", moment().format('MMMM Do YYYY, hh:mm:ss a')))

//if the node process ends, close the mongoose connection
process.on("SIGINT", () => {
    mongoose.connection.close()
        .then(() => {
            console.log("mongoose default connection disconnected through app termination");
            process.exit(0);
        })
})
