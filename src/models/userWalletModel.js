const mongoose = require('mongoose')
const config = require('../config/config')
const collection = require('../services/collection')

const userWalletSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        default: '',
    },
    chatId: {
        type: String,
        default: ''
    },
    antiRug: {
        type: Number,
        default: 0
    },
    smartSlippage: {
        type: Number,
        default: 0
    },
    degenMode: {
        type: Number,
        default: 0
    },
    maxGasPrice: {
        type: Number,
        default: 5
    },
    maxGasLimit: {
        type: Number,
        default: 0
    },
    slippage: {
        type: Number,
        default: 0
    },
    autoBuy: {
        type: Number,
        default: 0
    },
    doubleBuy: {
        type: Number,
        default: 0
    },
    buyGasPrice: {
        type: Number,
        default: 0
    },
    maxMarketCap: {
        type: Number,
        default: 0
    },
    minLiquidity: {
        type: Number,
        default: 0
    },
    maxLiquidity: {
        type: Number,
        default: 0
    },
    maxBuyTax: {
        type: Number,
        default: 0
    },
    maxSellTax: {
        type: Number,
        default: 0
    },
    autoSell: {
        type: Number,
        default: 0
    },
    trailingSell: {
        type: Number,
        default: 0
    },
    sellGasPrice: {
        type: Number,
        default: 0
    },
    autoSellHigh: {
        type: Number,
        default: 0
    },
    sellAmount: {
        type: Number,
        default: 0
    },
    autoSellLow: {
        type: Number,
        default: 0
    },
    sellAmount: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
})

const userWalletModel = mongoose.model(
    collection.collection_prefix.userwallet, userWalletSchema,
    config.database_prefix + collection.collection_suffix.userwallet
)

module.exports = userWalletModel