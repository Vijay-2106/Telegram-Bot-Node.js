const mongoose = require('mongoose')
const config = require('../config/config')
const collection = require('../services/collection')

const tokenSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        default: ''
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TB_tellawresu'
    },
    tokenDetails: [{
        tokenAddress: {
            type: String,
            default: ''
        },
        tokenName: {
            type: String,
            default: ''
        },
        tokenSymbol: {
            type: String,
            default: ''
        },
        tokenDecimals: {
            type: String,
            default: ''
        },
    }]
}, {
    timestamps: true
})

const tokenDetailsModel = mongoose.model(collection.collection_prefix.tokendetails, tokenSchema, config.database_prefix + collection.collection_suffix.tokendetails)

module.exports = tokenDetailsModel