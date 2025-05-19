const bot = require('../configration/botConfig')
const botMethodService = require('../services/bot.method')
const localDBService = require('../services/localDb.update.service')
const commonService = require('../services/common.service')
const callbackQueryMethods = require('../controllers/botControllers/callback_query/callBackQueryControllers')
const textQueryMethods = require('../controllers/botControllers/text_query/textQueryControllers')
const path = require('path')
const web3Provider = commonService.web3Provider()
const filePath = path.join(__dirname, '..', 'db', 'data.json')
//file system methods
const { fsReadFile, localDBCreate } = localDBService
// bot methods
const { ctxReplyWithKeyboardButton, } = botMethodService
// callbackquery Methods
const { connectWalletQuery, generateWalletQuery, disconnectWalletQuery, settingsReturnQuery, settingsQuery, updateSettingsQueryOptions, buySettingsOptionQuery, sellSettingsOptionQuery, initialSettingsUpdateQuery, buyAndSellReturnQuery, buyOrSellQuery, resetSettingsPropertiesToUpdateDBQuery, buyETHtoTokenStaticAmount, buyXETHUserSelectQuery, buyCancelOrder, checkBalanceQuery, confirmBuyQuery, buyTosellOrSellToBuyOptionsChange, userTokenApprovedQuery, sellTokenToETHStaticPercentage, cancelSellOrder, confirmSellTokenToETH, sellTokenToETHCustomPercentage, sellTokenToETHCustomUserSetValueQuery } = callbackQueryMethods
// text methods
const { connetWalletText, initialSettingsUpdate, incorrectInputHandle, buyOrSellTokenDetails, buyETHtoTokenUserGivenInputValue, sellTokenToETHUserGivenInputPercentage, sellTokenToETHUserGivenInputTokenValue } = textQueryMethods


// middleware
// BOT START
bot.start(async (ctx) => {
    try {
        await localDBCreate()
        await ctx.reply("Welcome to Osiz Sniper Bot");
        const getBlockNumber = await web3Provider.eth.getBlockNumber();
        const getGasPrice = await web3Provider.eth.getGasPrice()
        const botInfo = `🤖 Bot Information \n\nThis bot provides wallet connection and transaction functionalities.\n ETH NETWORK
      \n⛽Gas Fee: ${getGasPrice}.\n🔷Latest Block: ${getBlockNumber}`;
        const inlineKeyboard = [
            [{ text: "🔗 Connect Wallet", callback_data: "connectWallet" }],
            [{ text: "⚙️ Generate Wallet", callback_data: "generateWallet" }],
        ]
        await ctxReplyWithKeyboardButton(ctx, botInfo, inlineKeyboard)
    } catch (error) {
        console.log("🚀 ~ bot.start ~ error:", error)
        await ctx.reply('Something Went Wrong')
    }
});

// user button click reply
bot.on("callback_query", async (ctx) => {
    const data = ctx.update.callback_query.data
    // 
    switch (data) {
        case "connectWallet":
            await connectWalletQuery(ctx);
            break;
        case "generateWallet":
            await generateWalletQuery(ctx)
            break;
        case "settings":
            await settingsQuery(ctx)
            break;
        case "buy":
            await buyOrSellQuery(ctx, 'buy')
            break;
        case "sell":
            await buyOrSellQuery(ctx, 'sell')
            break;
        // button Enabled
        case "antiRug":
            await updateSettingsQueryOptions(ctx, 'antiRug')
            break;
        case "smartSlippage":
            await updateSettingsQueryOptions(ctx, 'smartSlippage')
            break;
        case "degenMode":
            await updateSettingsQueryOptions(ctx, 'degenMode')
            break;
        case "buySettings":
            await buySettingsOptionQuery(ctx)
            break;
        case "sellSettings":
            await sellSettingsOptionQuery(ctx)
            break;
        // price update
        case "maxGasPrice":
            await initialSettingsUpdateQuery(ctx, 'maxGasPrice')
            break;
        case "resetMaxGasPrice":
            await resetSettingsPropertiesToUpdateDBQuery(ctx, 'maxGasPrice')
            break;
        case "slippage":
            await initialSettingsUpdateQuery(ctx, 'slippage')
            break;
        case "resetSlippage":
            await resetSettingsPropertiesToUpdateDBQuery(ctx, 'slippage')
            break;
        case "maxGasLimit":
            await initialSettingsUpdateQuery(ctx, 'maxGasLimit')
            break;
        case "resetMaxGasLimit":
            await resetSettingsPropertiesToUpdateDBQuery(ctx, 'maxGasLimit')
            break;
        // buy Methods
        case "buy_0.0001_ETH":
            return await buyETHtoTokenStaticAmount(ctx, '0.0001')
        case "buy_0.0002_ETH":
            return await buyETHtoTokenStaticAmount(ctx, '0.0002')
        case "buy_0.0003_ETH":
            return await buyETHtoTokenStaticAmount(ctx, '0.0003')
        case "buy_0.0004_ETH":
            return await buyETHtoTokenStaticAmount(ctx, '0.0004')
        case "buyXETH":
            return await buyXETHUserSelectQuery(ctx)
        // sell
        case "sellToken25":
            return await sellTokenToETHStaticPercentage(ctx, '25')
        case "sellToken50":
            return await sellTokenToETHStaticPercentage(ctx, '50')
        case "sellToken75":
            return await sellTokenToETHStaticPercentage(ctx, '75')
        case "sellToken100":
            return await sellTokenToETHStaticPercentage(ctx, '100')
        case "sellWithPercentage":
            return await sellTokenToETHCustomPercentage(ctx)
        case "sellXTokens":
            return await sellTokenToETHCustomUserSetValueQuery(ctx)
        // 
        case "buyTosell":
            return await buyTosellOrSellToBuyOptionsChange(ctx, 'buyTosell')
        case "sellTobuy":
            return await buyTosellOrSellToBuyOptionsChange(ctx, 'sellTobuy')
        case "sellToBuyReturn":
            return await buyTosellOrSellToBuyOptionsChange(ctx, 'sellTobuy')
        case "approve":
            return await userTokenApprovedQuery(ctx)
        // 
        case "confirmBuy":
            return await confirmBuyQuery(ctx)
        case "buyCancelOrder":
            return await buyCancelOrder(ctx)
        // sell
        case "sellCancelOrder":
            return await cancelSellOrder(ctx)
        case "confirmSell":
            return await confirmSellTokenToETH(ctx)
        // 
        case "checkBalance":
            return await checkBalanceQuery(ctx)
        // return methods
        case "buyReturn":
            await buyAndSellReturnQuery(ctx)
            break;
        case "sellReturn":
            await buyAndSellReturnQuery(ctx)
            break;
        case "settingsReturn":
            await settingsReturnQuery(ctx)
            break;
        // disconnect
        case "disconnectWallet":
            await disconnectWalletQuery(ctx)
            break;
        default:
            break;
    }
});

// user text reply
bot.on("text", async (ctx) => {
    const { chat, text } = ctx.update.message
    console.log("🚀 ~ file: bot.index.js:164 ~ bot.on ~ text:", text)
    try {
        const userDatas = await fsReadFile(filePath)
        const currentUserData = userDatas?.find((user) => user.chat_id == chat.id)
        const userStatus = currentUserData?.currentStatus
        switch (userStatus) {
            case 'connectWallet':
                return await connetWalletText(ctx)
            case 'maxGasPrice':
                return await initialSettingsUpdate(ctx, 'maxGasPrice')
            case 'maxGasLimit':
                return await initialSettingsUpdate(ctx, 'maxGasLimit')
            case 'buy':
                return await buyOrSellTokenDetails(ctx)
            case 'sell':
                return await buyOrSellTokenDetails(ctx)
            case 'buyXETH':
                return await buyETHtoTokenUserGivenInputValue(ctx)
            case 'sellWithPercentage':
                return await sellTokenToETHUserGivenInputPercentage(ctx)
            case 'sellXTokens':
                return await sellTokenToETHUserGivenInputTokenValue(ctx)
            case 'connected':
                return await incorrectInputHandle(ctx)
            default:
                // await ctx.reply('Please Connected Your Wallet . Then Action It')
                break;
        }
    } catch (error) {
        console.log("🚀 ~ bot.on ~ error:", error)
    }
});


bot.launch().then(() => console.log('BOT Connected Successfully'))



