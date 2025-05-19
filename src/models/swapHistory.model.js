const mongoose = require('mongoose')
const config = require('../config/config')
const collection = require('../services/collection')

const swapHistorySchema = new mongoose.Schema({
    userAddress: {
        type: String,
        default: ''
    },
    transactionHash: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'pending'
    },
    tokenAddress: {
        type: String,
        default: ''
    },
    fromCurrency: {
        type: String,
        default: ''
    },
    toCurrency: {
        type: String,
        default: ''
    },
    spendAmount: {
        type: Number,
        default: 0
    },
    receiveAmount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        default: ''
    },
    percentage: {
        type: Number,
        default: ''
    }
}, {
    timestamps: true
})

const swapHistoryModel = mongoose.model(collection.collection_prefix.swaphistory, swapHistorySchema, config.database_prefix + collection.collection_suffix.swaphistory)

module.exports = swapHistoryModel