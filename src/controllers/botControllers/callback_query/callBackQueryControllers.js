const botMethodService = require('../../../services/bot.method')
const localDBService = require('../../../services/localDb.update.service')
const commonService = require('../../../services/common.service')
const globalUseState = require('../../../services/bot.global.state')
const commonUpdate = require('../../../bot/commonUpdate')
const mongoDbCommonQueries = require('../../../services/mongo.queries.common')
const ContractAddress = require('../../../contract/contract.address.json')
const path = require('path')
const web3Methods = require('../../../services/web3.service')
const filePath = path.join(__dirname, '..', '..', '..', 'db', 'data.json')
// web3 provider
const web3Provider = commonService.web3Provider()

//fs methods
const { fsReadFile, fsWriteFile, userDetailsUpdateLocalDB } = localDBService
// bot methods
const { ctxReplyWithKeyboardButton, inline_keyboard_generate_object, ctxEditMessageText, ctxServerSlowMessage, ctxTransactionWaitingMessage, ctxTransactionCancelMessage } = botMethodService
// commonUpdate
const { settingsOptionChangesUpdate, findeUserDetails, afterConnectedInlineKeyboard, buySettingOptions, sellSettingOptions, buyConfirmAndCancelOptionInlineKeyBoard, buyTokenDetailsUpdatedAndInlineKeyboard, sellTokenDetailsUpdatedAndInlineKeyboard, sellConfirmAndCancelOptionInlineKeyBoard } = commonUpdate
// useStates
const { deleteMessage, setDeleteMessage } = globalUseState
// mongoDbCommonQueries
const { userUpdateOurSettingOptionsQuery, givenInputUpdateDB, getUserAllTokenDetails } = mongoDbCommonQueries
// web3Methods
const { getTokenBalance, buyETHtoToken, getUserBalance, tokenApproved, sellTokenToETH, userReceivedAmountFindMethod } = web3Methods
// contract address
// bot methods


// functions
const connectWalletQuery = async (ctx) => {
    const { chat, message_id } = ctx.update.callback_query.message
    try {
        await ctx.reply("🔐 Please Enter your Private Key to connect your wallet" + '\n' + '<code>0xbaec7a4da117a23663b5cbfdc88e68cc4d980cbf2f3c867c31361283c7e9b1af</code>', { parse_mode: 'html' })
        const localDbData = await fsReadFile(filePath)
        const findUserDataIndex = localDbData.findIndex((user) => user.chat_id == chat.id)
        if (!(findUserDataIndex != -1)) {
            const userData = {
                chat_id: chat.id,
                currentStatus: 'connectWallet'
            }
            localDbData.push(userData)
            await fsWriteFile(filePath, localDbData)
        } else {
            localDbData[findUserDataIndex].currentStatus = 'connectWallet'
            await fsWriteFile(filePath, localDbData)
        }
        setDeleteMessage(deleteMessage.push(message_id))
        setDeleteMessage(deleteMessage.push(message_id + 1))
    } catch (error) {
        console.log("🚀 ~ connectWal ~ error:", error)
    }
};

// generate wallet

const generateWalletQuery = async (ctx) => {
    try {
        const { chat, message_id } = ctx.update.callback_query.message
        console.log("🚀 ~ generateWal ~ message_id:", message_id)
        const createNewWallet = await web3Provider.eth.accounts.create()
        const { address, privateKey } = createNewWallet
        await ctx.reply(`📍Your Address \n\n<code>${address}</code>\n\n🔐 Your Privatekey\n\n<code>${privateKey}</code>`, { parse_mode: 'html' })
        await ctxReplyWithKeyboardButton(ctx, `Your Wallet Details Above. Please Note That Details \n\n 📌 NOTE\nDon't Share Your Privatekey Anyone For Any Reason .Your Fund Maybe Lost\n`, [
            [inline_keyboard_generate_object("🔗 Connect Wallet", "connectWallet")]
        ])
        setDeleteMessage(deleteMessage.push(message_id))
        setDeleteMessage(deleteMessage.push(message_id + 1))
    } catch (error) {
        ctx.reply('Something Went Try Again Later')
        console.log("🚀 ~ generateWal ~ error:", error)
    }
}


const settingsQuery = async (ctx) => {
    try {
        const { message_id, chat } = ctx.update.callback_query.message
        const localDBData = await fsReadFile(filePath)
        const connectedUser = localDBData?.find((user) => user.chat_id == chat.id)
        const { userAddress } = connectedUser && connectedUser
        const { content, contentUpdateInlineKeyboard } = await settingsOptionChangesUpdate(userAddress)
        if (content && contentUpdateInlineKeyboard) {
            await ctxEditMessageText(ctx, chat.id, message_id, content, contentUpdateInlineKeyboard)
        } else {
            ctx.reply('Something Went Wrong Try Again Later')
        }

    } catch (error) {
        console.log("🚀 ~ settingsQuery ~ error:", error)
        ctx.reply('Something Went Wrong Try Again Later')
    }
}

// user Update Options
const updateSettingsQueryOptions = async (ctx, updateFiled) => {
    try {
        const message = ctx.update.callback_query.message
        const { chat, message_id } = ctx.update.callback_query.message
        const { userAddress } = await findeUserDetails(message, filePath)
        await userUpdateOurSettingOptionsQuery(ctx, userAddress, updateFiled)
        const { content, contentUpdateInlineKeyboard } = await settingsOptionChangesUpdate(userAddress)
        if (!content) {
            return ctx.reply('Something Went Wrong Try Agin Later')
        }
        await ctxEditMessageText(ctx, chat.id, message_id, content, contentUpdateInlineKeyboard)
    } catch (error) {
        ctx.reply('Something Went Wrong Try Again Later', error.message)
        console.log("🚀 ~ antiRugQuery ~ error:", error)
    }
}
// buy optin Query
const buySettingsOptionQuery = async (ctx) => {
    try {
        const message = ctx.update.callback_query.message
        const { chat, message_id } = ctx.update.callback_query.message
        const { userAddress } = await findeUserDetails(message, filePath)
        const { content, buySelectedOptionsInlineKeyBoard } = await buySettingOptions(userAddress)
        if (!content) {
            return ctx.reply('Something Went Wrong Try Again Later')
        }
        await ctxEditMessageText(ctx, chat.id, message_id, content, buySelectedOptionsInlineKeyBoard)
    } catch (error) {
        console.log("🚀 ~ buyOptionQuery ~ error:", error)
    }
}

// selloption Query
const sellSettingsOptionQuery = async (ctx) => {
    try {
        const message = ctx.update.callback_query.message
        const { chat, message_id } = ctx.update.callback_query.message
        const { userAddress } = await findeUserDetails(message, filePath)
        const { content, buySelectedOptionsInlineKeyBoard } = await sellSettingOptions(userAddress)
        if (!content) {
            return ctx.reply('Something Went Wrong Try Agin Later')
        }
        await ctxEditMessageText(ctx, chat.id, message_id, content, buySelectedOptionsInlineKeyBoard)
    } catch (error) {
        console.log("🚀 ~ buyOptionQuery ~ error:", error)
    }
}

// maxgasprice slippage maxgaslimit

const initialSettingsUpdateQueryContentCreate = async (updateFiled) => {
    try {
        let content
        if (updateFiled == 'maxGasPrice') {
            const gasPrice = await web3Provider.eth.getGasPrice()
            content = `Reply to this message with your desired maximum gas price. Current GAs Price ${web3Provider.utils.fromWei(gasPrice, 'Gwei')}.\n📌 Given Input Current Value Or Above`
        } else if (updateFiled == 'slippage') {
            content = 'Reply to this message with your desired slippage gas price(in gwei).1 gwei = 10 ^ 9 wei.Minimum is 5 gwei!'
        } else if (updateFiled == 'maxGasLimit') {
            const gasLimit = (await web3Provider.eth.getBlock()).gasLimit
            content = `Reply to this message with your desired maxGasLimit. Current Gas Limit ${parseFloat(gasLimit)}.\n📌 Given Input Current GasLimit Value Or Above `
        }
        return content
    } catch (error) {
        console.log("🚀 ~ initialSettingsUpdateQueryContentCreate ~ error:", error)
        return false
    }
}

const initialSettingsUpdateQuery = async (ctx, updateFiled) => {
    try {
        const content = await initialSettingsUpdateQueryContentCreate(updateFiled)
        const { chat, message_id } = ctx.update.callback_query.message
        const localDBData = await fsReadFile(filePath)
        const findUserDataIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        if (!(findUserDataIndex != -1)) {
            return await ctx.reply('❗ User Not Found .Please Connect Your Wallet')
        }
        localDBData[findUserDataIndex].currentStatus = updateFiled
        await ctx.reply(content)
        // const updateMessageId=message_id+1==
        // setDeleteMessage(deleteMessage.push(message_id) + 1)
        await fsWriteFile(filePath, localDBData)
    } catch (error) {
        console.log("🚀 ~ initialSettingsUpdateQuery ~ error:", error)
        ctx.reply('Something Went Wrong Try Again Later')
    }
}

// buy sell options
const buyOrSellQuery = async (ctx, updateValue) => {
    try {
        const { chat, message_id } = ctx.update.callback_query.message
        const localDbData = await fsReadFile(filePath)
        const findUserDataIndex = localDbData.findIndex((user) => user.chat_id == chat.id)
        localDbData[findUserDataIndex].currentStatus = updateValue
        await fsWriteFile(filePath, localDbData)
        await ctx.reply('Given Your Token Address\n <code>0x5cf44815Bf73e1bF455E34A247F5E39796E98e4D</code>', { parse_mode: 'html' })
    } catch (error) {
        console.log("🚀 ~ buySellQuery ~ error:", error)
        await ctx.reply('Something Went Wrong')
    }
}


// reset maxGasPrice,maxGasLimit
const getWeb3Updates = async (checkFiled) => {
    try {
        if (checkFiled == 'maxGasPrice') {
            const getGasPrice = await web3Provider.eth.getGasPrice()
            const hexToDecPrice = await web3Provider.utils.fromWei(getGasPrice, 'Gwei')
            return hexToDecPrice
        } else if (checkFiled == 'maxGasLimit') {
            const getGasPrice = (await web3Provider.eth.getBlock()).gasLimit
            return parseFloat(getGasPrice)
        }
    } catch (error) {
        console.log("🚀 ~ checkWeb3Prices ~ error:", error)
        return false
    }
}

const resetSettingsPropertiesToUpdateDBQuery = async (ctx, updateFiled) => {
    try {
        const message = ctx.update.callback_query.message
        const { chat } = ctx.update.callback_query.message
        const { userAddress } = await findeUserDetails(message, filePath)
        console.log("🚀 ~ resetSettingsPropertiesToUpdateDBQuery ~ userAddress:", userAddress)
        const currenctValue = await getWeb3Updates(updateFiled)
        if (!currenctValue) {
            await ctx.reply('Something Went Wrong Try Again Later')
        }
        const updateResponse = await givenInputUpdateDB(userAddress, updateFiled, currenctValue)
        if (!updateResponse) {
            return ctx.reply('Something Went Wrong Try Again Later')
        }
        await ctx.reply(`Your ${updateFiled} Reseted ✅`)
    } catch (error) {
        console.log("🚀 ~ resetPropertiesToUpdateDBQuery ~ error:", error)
        await ctx.reply('Something Went Wrong')
    }
}

// buy ethtotoken  0.0001,000.2
const buyETHtoTokenStaticAmount = async (ctx, amount) => {
    try {
        console.log('buyETHtoTokenStaticAmount start');
        const { chat, message_id } = ctx.update.callback_query.message
        const ctxMessage = ctx.update.callback_query.message
        const localDBData = await fsReadFile(filePath)
        if (!localDBData) {
            return await ctx.reply('Server Went Wrong Or Slow Connection')
        }
        const { userAddress } = localDBData?.find((user) => user.chat_id = chat.id)
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[userIndex].currentStatus = 'buy'
        localDBData[userIndex].amount = parseFloat(amount)
        // localDBData[userIndex].currentStatus = 'connected'
        await fsWriteFile(filePath, localDBData)
        const getBalance = await web3Provider.eth.getBalance(userAddress)
        var userBalanceHexTodec = web3Provider.utils.fromWei(getBalance, 'ether')
        if (amount > userBalanceHexTodec) {
            return ctx.reply('❌ InSufficient Balance')
        }
        const { inline_keyboard } = buyConfirmAndCancelOptionInlineKeyBoard()
        const { content: tokenDetailsContent } = await buyTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
        await ctxEditMessageText(ctx, chat.id, message_id, tokenDetailsContent, inline_keyboard)
    } catch (error) {
        console.log("🚀 ~ buyETHtoTokenStaticAmount ~ error:", error)
        return ctx.reply('Something Went Wrong Buy ETH to Token')
    }
}

// 
const buyXETHUserSelectQuery = async (ctx) => {
    try {
        const { chat, message_id } = ctx.update.callback_query.message
        const localDBData = await fsReadFile(filePath)
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[userIndex].currentStatus = 'buyXETH'
        await fsWriteFile(filePath, localDBData)
        await ctx.reply('Given Your ETH Value To Buy Tokens')
    } catch (error) {
        console.log("🚀 ~ buyXETHUSerSelectQuery ~ error:", error)
        return ctx.reply('Something Went Wrong In Buy X ETH')
    }
}

// cancelOrder
const buyCancelOrder = async (ctx) => {
    try {
        const { chat, message_id } = ctx.update.callback_query.message
        const ctxMessage = ctx.update.callback_query.message
        await ctxTransactionCancelMessage(ctx)
        const updateResponse = await userDetailsUpdateLocalDB(chat.id, filePath, null, 'connected', 0)
        if (!updateResponse) {
            return ctx.reply('Something Went Wrong Or Server Slow Try Again')
        }
        const buyTokenDetailsUpdatedResponse = await buyTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
        if (!buyTokenDetailsUpdatedResponse) {
            return await ctxServerSlowMessage(ctx)
        }
        const { content, inline_keyboard } = buyTokenDetailsUpdatedResponse
        await ctxEditMessageText(ctx, chat.id, message_id, content, inline_keyboard)
    } catch (error) {
        console.log("🚀 ~ cancelOrder ~ error:", error)
        return ctx.reply('Something Went Wrong Buy ETH to Token')
    }
}

// confirm to buy

const confirmBuyQuery = async (ctx) => {
    try {
        const ctxMessage = ctx.update.callback_query.message
        const { message_id, chat } = ctxMessage
        await ctxTransactionWaitingMessage(ctx)
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        if (!userDetails) {
            return await ctxServerSlowMessage(ctx)
        }
        const updateResponse = await userDetailsUpdateLocalDB(chat.id, filePath, null, 'connected', 0)
        const { userAddress, amount, tokenAddress, privateKey, tokenSymbol } = userDetails
        if (!amount) {
            await ctx.reply('Sorry Your Request May be Collapse. So Please Try Again')
        }
        const buyTokenDetailsUpdatedResponse = await buyTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
        if (!buyTokenDetailsUpdatedResponse) {
            return await ctxServerSlowMessage(ctx)
        }
        const { content, inline_keyboard } = buyTokenDetailsUpdatedResponse
        await ctxEditMessageText(ctx, chat.id, message_id, content, inline_keyboard)
        const userReceiveAmount = await userReceivedAmountFindMethod(amount, tokenAddress, 'buy')
        if (!userReceiveAmount?.status) {
            return ctx.reply(`Can't Read User Balance Try Again Later`)
        }
        const { spendAmount, receiveAmount } = userReceiveAmount && userReceiveAmount
        console.log("🚀 ~ confirmBuyQuery ~ receivedAmount:", spendAmount, receiveAmount)
        // userAddress, transactionHash,  tokenAddress, fromCurrency, toCurrency, spendAmount, receiveAmount, type
        await ctx.reply(`🔖 Your Buy Details \n Spend ETH : ${amount}\n\nToken(${tokenSymbol}) Receive : ${parseFloat(receiveAmount).toFixed(8)}`)
        await buyETHtoToken(ctx, userAddress, privateKey, tokenAddress, message_id, 'ETH', tokenSymbol, spendAmount, receiveAmount)

    } catch (error) {
        console.log("🚀 ~ file: callBackQueryControllers.js:324 ~ confirmBuyQuery ~ error:", error)
        return await ctxServerSlowMessage(ctx)
    }
}

// settingsReturn
const settingsReturnQuery = async (ctx) => {
    try {
        const { chat, message_id } = ctx.update.callback_query.message
        const text = "✅ Wallet Connected Successfully.You can now perform any actions below"
        await ctxEditMessageText(ctx, chat.id, message_id, text, afterConnectedInlineKeyboard)
    } catch (error) {
        ctx.reply('Something Went Wrong Try Again Later', error.message)
        console.log("🚀 ~ settingsReturn ~ error:", error)
    }
}
// buy sell return
const buyAndSellReturnQuery = async (ctx) => {
    try {
        const message = ctx.update.callback_query.message
        const { chat, message_id } = ctx.update.callback_query.message
        const { userAddress } = await findeUserDetails(message, filePath)
        console.log("🚀 ~ buyAndSellReturnQuery ~ userAddress:", userAddress)
        const { content, contentUpdateInlineKeyboard } = await settingsOptionChangesUpdate(userAddress)
        if (!content) {
            return ctx.reply('Something Went Wrong Try Agin Later')
        }
        await ctxEditMessageText(ctx, chat.id, message_id, content, contentUpdateInlineKeyboard)
    } catch (error) {
        console.log("🚀 ~ buyAndSellReturnQuery ~ error:", error)
    }
}

// tokenapproved
const userTokenApprovedQuery = async (ctx) => {
    try {
        const ctxMessage = ctx.update.callback_query.message
        const { message_id, chat } = ctxMessage
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        if (!userDetails) {
            return ctxServerSlowMessage(ctx)
        }
        const { userAddress, tokenAddress, privateKey } = userDetails
        const userTokenBalace = await getTokenBalance(tokenAddress, userAddress)
        if (!userTokenBalace) {
            return ctxServerSlowMessage(ctx)
        }
        await tokenApproved(ctx, userTokenBalace, userAddress, privateKey, tokenAddress, message_id)
    } catch (error) {
        console.log("🚀 ~ file: callBackQueryControllers.js:373 ~ tokenApproved ~ error:", error)
        return ctxServerSlowMessage(ctx)
    }
}

// buyTosell and  sellToBuy
const buyTosellOrSellToBuyOptionsChange = async (ctx, changeStatus) => {
    try {
        const { chat, message_id } = ctx.update.callback_query.message
        const ctxMessage = ctx.update.callback_query.message
        if (changeStatus == 'buyTosell') {
            const sellTokenResponse = await sellTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
            if (!sellTokenResponse) {
                return ctxServerSlowMessage(ctx)
            }
            const { content, inline_keyboard } = sellTokenResponse
            await ctxEditMessageText(ctx, chat.id, message_id, content, inline_keyboard)
        } else {
            const buyTokenResponse = await buyTokenDetailsUpdatedAndInlineKeyboard(ctxMessage, filePath)
            if (!buyTokenResponse) {
                return ctxServerSlowMessage(ctx)
            }
            const { content, inline_keyboard } = buyTokenResponse
            await ctxEditMessageText(ctx, chat.id, message_id, content, inline_keyboard)
        }
    } catch (error) {
        console.log("🚀 ~ file: callBackQueryControllers.js:374 ~ buyTosellOrSellToBuyOptionsChange ~ error:", error)
        return ctxServerSlowMessage(ctx)
    }
}

// sell token to eth

const sellTokenToETHStaticPercentage = async (ctx, sellPercentage) => {
    try {
        const ctxMessage = ctx.update.callback_query.message
        const { chat } = ctxMessage
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        if (!userDetails) {
            return ctxServerSlowMessage(ctx)
        }
        const { tokenAddress, userAddress } = userDetails && userDetails
        const getUserTokenBalance = await getTokenBalance(tokenAddress, userAddress)
        if (!getUserTokenBalance) {
            return ctxServerSlowMessage(ctx)
        }
        const calculateUserTokenWithPercentage = parseFloat(getUserTokenBalance) * (Number(sellPercentage) / 100)
        console.log("🚀 ~ sellTokenToETHStaticPercentage ~ calculateUserTokenWithPercentage:", calculateUserTokenWithPercentage)
        let localDBData = await fsReadFile(filePath)
        const findUserIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[findUserIndex].sellPercentage = sellPercentage
        localDBData[findUserIndex].sellAmount = calculateUserTokenWithPercentage.toFixed(18)
        await fsWriteFile(filePath, localDBData)
        const contentText = `Your Sell Details \nSell Token Percentage ${sellPercentage}%\n Token Count  :${calculateUserTokenWithPercentage.toFixed(6)}`
        const { inline_keyboard } = sellConfirmAndCancelOptionInlineKeyBoard()
        await ctxReplyWithKeyboardButton(ctx, contentText, inline_keyboard)
    } catch (error) {
        console.log("☮️ ~ file: callBackQueryControllers.js:431 ~ sellTokenToEthStaticPercentage ~ error:", error)
        return ctxServerSlowMessage(ctx)
    }
}

// 
const sellTokenToETHCustomUserSetValueQuery = async (ctx) => {
    try {
        const ctxMessage = ctx.update.callback_query.message
        const { chat, message_id } = ctxMessage
        const localDBData = await fsReadFile(filePath)
        if (!localDBData) {
            return ctxServerSlowMessage(ctx, 'Not Found LocalDB Data')
        }
        const findUserIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[findUserIndex].currentStatus = 'sellXTokens'
        await fsWriteFile(filePath, localDBData)
        await ctx.reply('Given Your Token Value')
    } catch (error) {
        console.log("🚀 ~ sellTokenToETHCustomUserSetValueQuery ~ error:", error)
        return ctxServerSlowMessage(ctx, 'sellTokenToETHCustomUserSetValueQuery')
    }
}
// 
const sellTokenToETHCustomPercentage = async (ctx) => {
    try {
        const { chat } = ctx.update.callback_query.message
        await ctx.reply('Enter Your Token With Percentage')
        const localDBData = await fsReadFile(filePath)
        if (!localDBData) {
            return await ctxServerSlowMessage(ctx, 'For sellTokenToETHCustomPercentage')
        }
        const findUserIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[findUserIndex].currentStatus = 'sellWithPercentage'
        await fsWriteFile(filePath, localDBData)
    } catch (error) {
        console.log("🚀 ~ sellTokenToETHCustomPercentage ~ error:", error)
        return ctxServerSlowMessage(ctx, `in sellTokenToETHCustomPercentage`)
    }
}

const cancelSellOrder = async (ctx) => {
    try {
        const { message_id, chat } = ctx.update.callback_query.message
        let localDBData = await fsReadFile(filePath)
        if (!localDBData) {
            return ctxServerSlowMessage(ctx)
        }
        await ctxTransactionCancelMessage(ctx)
        const userIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[userIndex].sellPercentage = 0
        localDBData[userIndex].currentStatus = 'connected'
        localDBData[userIndex].sellAmount = 0
        await fsWriteFile(filePath, localDBData)
        await ctx.deleteMessage(message_id)
    } catch (error) {
        console.log("🚀 ~ file: callBackQueryControllers.js:449 ~ cancelSellOrder ~ error:", error)
        return ctxServerSlowMessage(ctx)
    }
}

const confirmSellTokenToETH = async (ctx) => {
    try {
        const ctxMessage = ctx.update.callback_query.message
        const { message_id, chat } = ctxMessage
        await ctx.deleteMessage(message_id)
        await ctxTransactionWaitingMessage(ctx)
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        let localDBData = await fsReadFile(filePath)
        if (!userDetails) {
            return ctxServerSlowMessage(ctx)
        }
        if (!localDBData) {
            return ctxServerSlowMessage(ctx)
        }
        const findUserIndex = localDBData?.findIndex((user) => user.chat_id == chat.id)
        localDBData[findUserIndex].sellPercentage = 0
        localDBData[findUserIndex].currentStatus = 'connected'
        localDBData[findUserIndex].sellAmount = 0
        await fsWriteFile(filePath, localDBData)
        const { userAddress, sellPercentage, tokenAddress, privateKey, sellAmount, tokenSymbol } = userDetails && userDetails
        const userReceivedAmount = await userReceivedAmountFindMethod(sellAmount, tokenAddress, 'sell')
        if (!userReceivedAmount?.status) {
            return ctx.reply(`Can't Find User Balance Try Again Later`)
        }
        const { spendAmount, receiveAmount } = userReceivedAmount
        // userAddress, transactionHash, tokenAddress, fromCurrency, toCurrency, spendAmount, receiveAmount, type
        await sellTokenToETH(ctx, userAddress, privateKey, tokenAddress, sellPercentage, message_id, tokenSymbol, 'ETH', sellAmount, receiveAmount)
    } catch (error) {
        console.log("🚀 ~ file: callBackQueryControllers.js:465 ~ confirmSellTokenToETH ~ error:", error)
        await ctxServerSlowMessage(ctx)
    }
}

// check balance
const checkBalanceQuery = async (ctx) => {
    try {
        const ctxMessage = ctx.update.callback_query.message
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        if (!userDetails) {
            return ctxServerSlowMessage(ctx)
        }
        const { userAddress } = userDetails && userDetails
        // Db Fetching Data 
        const tokenResponse = await getUserAllTokenDetails(ctx, ctxMessage, filePath)
        if (!tokenResponse) {
            return ctxServerSlowMessage(ctx)
        }
        const tokenDetailsDBdata = tokenResponse?.tokenDetails
        let tokenDetailsCreateNewArrayWithBalance = []
        const ethBalance = await getUserBalance(userAddress)
        for (let i = 0; i < tokenDetailsDBdata.length; i++) {
            try {
                const tokenBalance = await getTokenBalance(tokenDetailsDBdata[i]?.tokenAddress, userAddress)
                const tokenDetailsObj = {
                    tokenBalance,
                    tokenSymbol: tokenDetailsDBdata[i]?.tokenSymbol,
                    tokenAddress: tokenDetailsDBdata[i]?.tokenAddress
                }
                tokenDetailsCreateNewArrayWithBalance.push(tokenDetailsObj)
            } catch (error) {
                console.log("🚀 ~ file: callBackQueryControllers.js:358 ~ checkBalanceQuery ~ error:", error)
            }
        }
        await ctx.reply(`Your Portfolio 💰\n\nETH : ${parseFloat(ethBalance).toFixed(6)}\n\n${tokenDetailsCreateNewArrayWithBalance?.map((token) => {
            const tokenDetails = token?.tokenSymbol + ':' + parseFloat(token?.tokenBalance).toFixed(6) + '\n'
            return tokenDetails
        })}`)
    } catch (error) {
        console.log("🚀 ~ file: callBackQueryControllers.js:351 ~ checkBalanceQuery ~ error:", error)
        return await ctxServerSlowMessage(ctx)
    }
}

// disconnect
const disconnectWalletQuery = async (ctx) => {
    try {
        const { message_id, chat } = ctx.update.callback_query.message
        const localDbData = await fsReadFile(filePath)
        const disconnectUserRemoveDBUpdate = localDbData.filter((user) => user.chat_id !== chat.id)
        await fsWriteFile(filePath, disconnectUserRemoveDBUpdate)
        console.log(deleteMessage);
        setDeleteMessage(deleteMessage.push(message_id))
        await ctx.deleteMessage(message_id)
        // deleteMessage.forEach(async (messageId) => {
        //     try {
        //         await ctx.deleteMessage(messageId)
        //     } catch (error) {
        //         console.log("🚀 ~ deleteMessage.forEach ~ error:", error)
        //     }
        // })
        // setDeleteMessage(deleteMessage.splice(0, deleteMessage.length))
    } catch (error) {
        ctx.reply('Something Went Wrong')
        console.log("🚀 ~ disconnectWal ~ error:", error)
    }
}

// 


module.exports = { connectWalletQuery, generateWalletQuery, disconnectWalletQuery, settingsReturnQuery, settingsQuery, updateSettingsQueryOptions, buySettingsOptionQuery, sellSettingsOptionQuery, buyAndSellReturnQuery, initialSettingsUpdateQuery, buyOrSellQuery, resetSettingsPropertiesToUpdateDBQuery, buyETHtoTokenStaticAmount, buyXETHUserSelectQuery, buyCancelOrder, checkBalanceQuery, confirmBuyQuery, buyTosellOrSellToBuyOptionsChange, userTokenApprovedQuery, sellTokenToETHStaticPercentage, cancelSellOrder, confirmSellTokenToETH, sellTokenToETHCustomPercentage, sellTokenToETHCustomUserSetValueQuery }


