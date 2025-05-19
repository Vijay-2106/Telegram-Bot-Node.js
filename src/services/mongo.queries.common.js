const UserWalletModel = require('../models/userWalletModel')
const TokenDetailsModel = require('../models/tokenDetails.model')
const swapHistoryModel = require('../models/swapHistory.model')
const { findeUserDetails } = require('../bot/commonUpdate')
const { ctxServerSlowMessage } = require('./bot.method')

const userUpdateOurSettingOptionsQuery = async (ctx, userAddress, updateFiled) => {
    try {
        const findSpecificData = {}
        findSpecificData[updateFiled] = 1
        const getUserWalletDetails = await UserWalletModel.findOne({ userAddress }, findSpecificData)
        const updateValue = getUserWalletDetails[updateFiled] ? 0 : 1
        const updateObject = {}
        updateObject[updateFiled] = updateValue
        await UserWalletModel.updateOne({ userAddress }, { $set: updateObject })
        return true
    } catch (error) {
        console.log("🚀 ~ userUpdateOurSettingOptionsQuery ~ error:", error)
        return ctx.reply('Something Went Wrong Try Again Later', error.message)
    }
}

// update maxPrice maxGas Slippage
const givenInputUpdateDB = async (userAddress, updateFiled, updateValue) => {
    try {
        const updateObject = {}
        updateObject[updateFiled] = updateValue
        await UserWalletModel.updateOne({ userAddress }, { $set: updateObject })
        return true
    } catch (error) {
        console.log("🚀 ~ givenInputUpdateDB ~ error:", error)
        return false
    }
}
// token Create
const userGivenTokenDetailsCreateDB = async (userAddress, tokenDetails) => {
    try {
        const { name, decimals, symbol, tokenAddress } = tokenDetails
        const existingTokenDetails = await TokenDetailsModel.find({ userAddress }, { tokenDetails: { $elemMatch: { tokenAddress } } })
        if (existingTokenDetails && existingTokenDetails[0].tokenDetails.length > 0) {
            return
        }
        const pushTokenDetails = {
            tokenAddress,
            tokenName: name,
            tokenSymbol: symbol,
            tokenDecimals: decimals,
        }
        await TokenDetailsModel.updateOne({ userAddress }, { $push: { tokenDetails: pushTokenDetails } })
        return true
    } catch (error) {
        console.log("🚀 ~ userTokenCreateDB ~ error:", error)
        return false
    }
}
// 
const userTokenDetailsInitiallyCreateArray = async (userAddress) => {
    try {
        const existingUser = await TokenDetailsModel.findOne({ userAddress })
        const userDetails = await UserWalletModel.findOne({ userAddress })
        if (!existingUser) {
            const createTokenWallet = {
                userAddress,
                userId: userDetails._id,
                tokenDetails: []
            }
            await TokenDetailsModel.create(createTokenWallet)
        }
        return true
    } catch (error) {
        console.log("🚀 ~ userTokenDetailsInitiallyCreate ~ error:", error)
        return false
    }
}
// 
const getUserAllTokenDetails = async (ctx, ctxMessage, filePath) => {
    try {
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        if (!userDetails) {
            return ctx.reply('Please Connected Your Wallet')
        }
        const { userAddress } = userDetails && userDetails
        const tokenDetailsResponse = await TokenDetailsModel.findOne({ userAddress })
        if (!tokenDetailsResponse) {
            return ctxServerSlowMessage(ctx)
        }
        return tokenDetailsResponse
    } catch (error) {
        console.log("🚀 ~ file: mongo.queries.common.js:81 ~ getUserAllTokenDetails ~ error:", error)
        return false
    }
}
// transaction History
const swapUserHistoryCreate = async (userAddress, transactionHash, tokenAddress, fromCurrency, toCurrency, spendAmount, receiveAmount, type, percentage = 0) => {
    try {
        const swapHistoryData = {
            transactionHash,
            userAddress,
            fromCurrency,
            toCurrency,
            spendAmount: parseFloat(spendAmount),
            receiveAmount: parseFloat(receiveAmount),
            tokenAddress,
            type,
            percentage: percentage ? percentage : 0
        }
        await swapHistoryModel.create(swapHistoryData)
        return true
    } catch (error) {
        console.log("🚀 ~ file: mongo.queries.common.js:101 ~ swapUserHistoryCreate ~ error:", error)
        return false
    }
}
// 
const swapHistoryStatusUpdate = async (transactionHash, updateValue) => {
    try {
        await swapHistoryModel.updateOne({ transactionHash }, { $set: { status: updateValue } })
        return true
    } catch (error) {
        console.log("🚀 ~ file: mongo.queries.common.js:118 ~ swapHistoryStatusUpdate ~ error:", error)
        return false
    }
}
// exports fumctions
module.exports = { userUpdateOurSettingOptionsQuery, givenInputUpdateDB, userGivenTokenDetailsCreateDB, userTokenDetailsInitiallyCreateArray, getUserAllTokenDetails, swapUserHistoryCreate, swapHistoryStatusUpdate }