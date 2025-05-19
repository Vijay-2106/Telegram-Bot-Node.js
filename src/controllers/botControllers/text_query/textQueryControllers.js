const localDBService = require('../../../services/localDb.update.service')
const commonService = require('../../../services/common.service')
const UserWalletModel = require('../../../models/userWalletModel')
const globalUseState = require('../../../services/bot.global.state')
const commonUpdate = require('../../../bot/commonUpdate')
const mongoDBCommonQueries = require('../../../services/mongo.queries.common')
const web3Methods = require('../../../services/web3.service')
const path = require('path')
const botMethods = require('../../../services/bot.method')
const filePath = path.join(__dirname, '..', '..', '..', 'db', 'data.json')
// 
const web3Provider = commonService.web3Provider()
// methods 
const { fsReadFile, fsWriteFile } = localDBService
// states
const { deleteMessage, setDeleteMessage } = globalUseState
// commonInlineKeyboard methods
const { afterConnectedInlineKeyboard, findeUserDetails, buyTokenDetailsUpdatedAndInlineKeyboard, sellConfirmAndCancelOptionInlineKeyBoard, sellTokenDetailsUpdatedAndInlineKeyboard } = commonUpdate
// mongoDb Queries
const { givenInputUpdateDB, userGivenTokenDetailsCreateDB, userTokenDetailsInitiallyCreateArray } = mongoDBCommonQueries
// web3Methods
const { getTokenDetails, tokenContractInstanceCreate, getUserBalance, getTokenBalance } = web3Methods
// botMethods
const { ctxReplyWithKeyboardButton, ctxServerSlowMessage, ctxTransactionWaitingMessage } = botMethods
// web3 Methods
const { buyETHtoToken } = require('../../../services/web3.service')


// functions
const localDBStatusChange = async (chat_id) => {
    try {
        const localDBData = await fsReadFile(filePath)
        const findUserDatIbdex = localDBData?.findIndex((user) => user.chat_id == chat_id)
        localDBData[findUserDatIbdex].currentStatus = 'connected'
        await fsWriteFile(filePath, localDBData)
    } catch (error) {
        console.log("🚀 ~ statusChangeToConnected ~ error:", error)
        return false
    }
}


const connetWalletText = async (ctx) => {
    const { message_id, chat } = ctx.update.message
    setDeleteMessage(deleteMessage.push(message_id))
    try {
        let userInput = (ctx.message.text).toLowerCase()
        if (!userInput.startsWith('0x')) {
            userInput = '0x' + userInput
        }
        const chat_id = ctx.message.chat.id;
        const isValid = await web3Provider.utils.isHexStrict(userInput) &&
            web3Provider.eth.accounts.privateKeyToAccount(userInput) !== null;
        if (isValid) {
            const userDetails = await web3Provider.eth.accounts.privateKeyToAccount(userInput)
            const { address } = userDetails
            const getBalance = await web3Provider.eth.getBalance(address)
            var balanceHexToDec = web3Provider.utils.fromWei(getBalance, 'ether')
            let botDatabase = await fsReadFile(filePath)
            botDatabase = botDatabase.filter((user) => user.chat_id !== chat_id)
            const existingData = botDatabase.find((item) => item.userAddress == address)
            // 
            if (!existingData) {
                console.log("🚀 ~ connetWalletFn ~ existingData:", existingData)
                const userData = {
                    chat_id,
                    privateKey: commonService.encryption(userInput),
                    userAddress: address,
                    status: true,
                    currentStatus: 'connected'
                }
                try {
                    if (botDatabase && botDatabase?.length > 0) {
                        botDatabase.push(userData)
                    } else {
                        botDatabase.push(userData)
                    }
                    await fsWriteFile(filePath, botDatabase)
                } catch (error) {
                    await ctx.reply('Something Went Wrong Try Again')
                    console.error("Error reading JSON file:", error);
                }
            }
            deleteMessage.forEach(async (messageId) => {
                await ctx.deleteMessage(messageId)
            })
            // setDeleteMessage(deleteMessage.splice(0, deleteMessage.length))
            const existingUser = await UserWalletModel.findOne({ userAddress: address })
            if (!existingUser) {
                await UserWalletModel.create({ userAddress: address, chatId: chat.id })
            }
            const response = await userTokenDetailsInitiallyCreateArray(address)
            if (!response) {
                return ctx.reply('Wallet Connetion Error Try Again Later')
            }
            await ctx.reply(`📍 Your Address :\n\n ${address}\n\n💰 Your ETH Balance  : ${balanceHexToDec} `)
            await ctx.reply(
                "✅ Wallet Connected Successfully.You can now perform any actions below",
                { reply_markup: { inline_keyboard: afterConnectedInlineKeyboard }, parse_mode: 'html' }
            );
        } else {
            await ctx.reply("❌ Invalid Private Key");
        }
    } catch (error) {
        await ctx.reply("Something Went Wrong Try Again Later");
        console.log("🚀 ~ connetWalletFn ~ error:", error)
    }
}

// buyTokenDetails

const buyOrSellTokenDetails = async (ctx) => {
    try {
        const { chat, message_id, text } = ctx.update.message
        console.log("🚀 ~ buyOrSellTokenDetails ~ chat:", chat)
        const ctxMessage = ctx.update.message
        const checkValidAddress = web3Provider.utils.isAddress(text)
        if (!checkValidAddress) {
            return ctx.reply('Given Must Be Valid Adddress')
        }
        const tokenContractInstance = tokenContractInstanceCreate(text)
        const tokenDetails = await getTokenDetails(tokenContractInstance)
        if (!tokenDetails) {
            return ctx.reply('Not Found Token Details')
        }
        tokenDetails.tokenAddress = text //add to address same object
        const localDBData = await fsReadFile(filePath)
        if (!localDBData) {
            return ctx.reply('Server Will Go Slow Try Again Later')
        }
        const { name, decimals, symbol } = tokenDetails
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        const { userAddress, currentStatus } = localDBData?.find((user) => user.chat_id == chat.id)
        localDBData[userIndex].tokenAddress = text
        localDBData[userIndex].tokenName = name
        localDBData[userIndex].tokenDecimals = decimals
        localDBData[userIndex].tokenSymbol = symbol
        await fsWriteFile(filePath, localDBData)
        const response = await userGivenTokenDetailsCreateDB(userAddress, tokenDetails)
        if (currentStatus == 'buy') {
            const buyTokenResponse = await buyTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
            if (!buyTokenResponse) {
                return ctx.reply('Something Went Wrong Or Server Slow')
            }
            const { content, inline_keyboard } = buyTokenResponse
            await ctxReplyWithKeyboardButton(ctx, content, inline_keyboard)
        } else if (currentStatus == 'sell') {
            const sellTokenReponse = await sellTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
            if (!sellTokenReponse) {
                return ctxServerSlowMessage(ctx)
            }
            const { content, inline_keyboard } = sellTokenReponse
            await ctxReplyWithKeyboardButton(ctx, content, inline_keyboard)
        }

    } catch (error) {
        console.log("🚀 ~ buyTokenDetails ~ error:", error)
    }
}


// buy User Custom  given Inputs

const buyETHtoTokenUserGivenInputValue = async (ctx) => {
    try {
        const { text: amount, chat, message_id } = ctx.update.message
        const localDBData = await fsReadFile(filePath)
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        const numberRegExp = /^\d+((\.)\d+)?$/ //positive number allowed with point(.)value
        if (numberRegExp.test(amount)) {
            if (parseFloat(amount) == 0) {
                return ctx.reply('Please Avoid Zero Or Invalid Number Types')
            }
            const userDetails = await findeUserDetails(ctx.update.message, filePath)
            if (!userDetails) {
                return ctx.reply('Please Connect Your Wallet First')
            }
            const { userAddress, tokenAddress, privateKey } = userDetails
            const userBalance = await getUserBalance(userAddress)
            if (userBalance < amount) {
                return ctx.reply('❌ InSufficient Balance')
            }
            localDBData[userIndex].currentStatus = 'connected'
            localDBData[userIndex].amount = amount
            await fsWriteFile(filePath, localDBData)
            await ctxTransactionWaitingMessage(ctx)
            await buyETHtoToken(ctx, amount, userAddress, privateKey, tokenAddress, message_id)
        } else {
            await ctx.reply('❗ Given Input. Only Number Allowed')
        }
    } catch (error) {
        console.log("🚀 ~ buyETHtoTokenUserGivenInputValue ~ error:", error)
        await ctx.reply('Something Went Wrong For BuyXETH Tokens')
    }
}


// maxGasPrice,masLimitPrice,

const checkWeb3Prices = async (checkValue, checkFiled) => {
    try {
        if (checkFiled == 'maxGasPrice') {
            const getGasPrice = await web3Provider.eth.getGasPrice()
            const hexToDecPrice = await web3Provider.utils.fromWei(getGasPrice, 'Gwei')
            if (hexToDecPrice <= checkValue) {
                return true
            } else {
                return false
            }
        } else if (checkFiled == 'maxGasLimit') {
            const getGasPrice = (await web3Provider.eth.getBlock()).gasLimit
            if (parseFloat(getGasPrice) <= checkValue) {
                return true
            } else {
                return false
            }
        }
    } catch (error) {
        console.log("🚀 ~ checkWeb3Prices ~ error:", error)
        return false
    }
}


// sell ETH to token
const sellTokenToETHUserGivenInputPercentage = async (ctx) => {
    try {
        const { text: sellPercentage, chat } = ctx.update.message
        let localDBData = await fsReadFile(filePath)
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        const numberRegExp = /^\d+((\.)\d+)?$/ //positive number allowed with point(.)value
        if (numberRegExp.test(sellPercentage)) {
            if (parseFloat(sellPercentage) == 0) {
                return ctx.reply('Please Avoid Zero Or Invalid Number Types')
            }
            const userDetails = await findeUserDetails(ctx.update.message, filePath)
            if (!userDetails) {
                return ctx.reply('Please Connect Your Wallet First')
            }
            const { userAddress, tokenAddress } = userDetails
            const userTokenBalance = await getTokenBalance(tokenAddress, userAddress)
            if (!userTokenBalance) {
                return ctxServerSlowMessage(ctx, 'Get User Balance')
            }
            const calculateUserSellAmout = parseFloat(userTokenBalance) * (parseFloat(sellPercentage) / 100)
            localDBData[userIndex].currentStatus = 'connected'
            localDBData[userIndex].sellPercentage = sellPercentage
            localDBData[userIndex].sellAmount = calculateUserSellAmout.toFixed(18)
            await fsWriteFile(filePath, localDBData)
            const contentText = `Your Sell Details \nSell Token Percentage ${sellPercentage}%\n Token Count  :${calculateUserSellAmout.toFixed(6)}`
            const { inline_keyboard } = sellConfirmAndCancelOptionInlineKeyBoard()
            await ctxReplyWithKeyboardButton(ctx, contentText, inline_keyboard)
        } else {
            await ctx.reply('❗ Given Input Only Number Allowed')
        }
    } catch (error) {
        console.log("🚀 ~ sellTokenToETHUserGivenInputPercentage ~ error:", error)
        return await ctxServerSlowMessage(ctx, 'sellTokenToETHUserGivenInputPercentage')
    }
}
// 
const sellTokenToETHUserGivenInputTokenValue = async (ctx) => {
    try {
        const { text: sellTokenAmount, chat } = ctx.update.message
        let localDBData = await fsReadFile(filePath)
        if (!localDBData) {
            return ctxServerSlowMessage(ctx)
        }
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        const numberRegExp = /^\d+((\.)\d+)?$/ //positive number allowed with point(.)value
        if (numberRegExp.test(sellTokenAmount)) {
            if (parseFloat(sellTokenAmount) == 0) {
                return ctx.reply('Please Avoid Zero Or Invalid Number Types')
            }
            const userDetails = await findeUserDetails(ctx.update.message, filePath)
            if (!userDetails) {
                return ctx.reply('Please Connect Your Wallet First')
            }
            const { userAddress, tokenAddress } = userDetails
            const userTokenBalance = await getTokenBalance(tokenAddress, userAddress)
            if (!userTokenBalance) {
                return ctxServerSlowMessage(ctx, 'Get User Balance')
            }
            if (userTokenBalance < sellTokenAmount) {
                return ctx.reply('❌ Insufficient Balance')
            }
            localDBData[userIndex].currentStatus = 'connected'
            localDBData[userIndex].sellAmount = parseFloat(sellTokenAmount).toFixed(18)
            await fsWriteFile(filePath, localDBData)
            const contentText = `Your Sell Details \nToken Count :${parseFloat(sellTokenAmount).toFixed(6)}`
            const { inline_keyboard } = sellConfirmAndCancelOptionInlineKeyBoard()
            await ctxReplyWithKeyboardButton(ctx, contentText, inline_keyboard)
        } else {
            await ctx.reply('❗ Given Input Only Number Allowed')
        }
    } catch (error) {
        console.log("🚀 ~ sellTokenToETHUserGivenInputTokenValue ~ error:", error)
        return await ctxServerSlowMessage(ctx, 'sellTokenToETHUserGivenInputTokenValue')
    }
}


// 
const initialSettingsUpdate = async (ctx, updateFiled) => {
    try {
        const message = ctx.update.message
        const { text, chat } = ctx.update.message
        const { userAddress } = await findeUserDetails(message, filePath)
        const numberRegExp = /^\d+((\.)\d+)?$/ //positive number allowed with point(.)value
        if (numberRegExp.test(text)) {
            if (parseFloat(text) == 0) {
                return ctx.reply('Please Avoid Zero Or Invalid Number Types')
            }
            const web3PricesCheck = await checkWeb3Prices(text, updateFiled)
            if (!web3PricesCheck) {
                return ctx.reply(`Update Your Value . Current ${updateFiled} Value Or Above the Value`)
            }
            const response = await givenInputUpdateDB(userAddress, updateFiled, text)
            if (!response) {
                return ctx.reply('Something Went Wrong Try Again Later')
            }
            await ctx.reply(`Your ${updateFiled.toUpperCase()} ${text} Updated ✅`)
            await localDBStatusChange(chat.id)
            console.log("🚀 ~ deleteMessage.forEach ~ deleteMessage:", deleteMessage)
            // deleteMessage.forEach(async (messageId) => {
            //     await ctx.deleteMessage(messageId)
            // })
        } else {
            await ctx.reply('❗ Given Input Only Number Allowed')
        }
    } catch (error) {
        console.log("🚀 ~ initialSettingsUpdate ~ error:", error)
        return ctx.reply('Something Went Wrong Try Agin Later')
    }
}
// incorrectInputHandle
const incorrectInputHandle = async (ctx) => {
    try {
        await ctx.reply('Please Selected Any Options Above 👆.Then Performe It')
    } catch (error) {
        await ctx.reply('Something Went Wrong Try Again Later')
        console.log("🚀 ~ incorrectInputHandle ~ error:", error)
    }
}

module.exports = { connetWalletText, initialSettingsUpdate, incorrectInputHandle, buyOrSellTokenDetails, buyETHtoTokenUserGivenInputValue, sellTokenToETHUserGivenInputPercentage, sellTokenToETHUserGivenInputTokenValue }
