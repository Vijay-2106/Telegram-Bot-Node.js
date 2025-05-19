const UserWalletModel = require('../models/userWalletModel')
const localDbService = require('../services/localDb.update.service')
// methods
const { inline_keyboard_generate_object } = require('../services/bot.method')
// 
const { fsReadFile } = localDbService
// functions

const findeUserDetails = async (ctxMessage, filePath) => {
    try {
        const { chat } = ctxMessage
        const localDBData = await fsReadFile(filePath)
        const userDetails = localDBData?.find((user) => user.chat_id == chat.id)
        return userDetails
    } catch (error) {
        console.log("🚀 ~ findeUserAddress ~ error:", error)
        return false
    }
}
// 
const contentCreateFunction = async (userAddress) => {
    try {
        const userWalletDetails = await UserWalletModel.findOne({ userAddress })
        const { antiRug, smartSlippage, degenMode } = userWalletDetails
        let content = `🔖 General :\nAnti-Rug:${antiRug ? '✅' : '⛔'}\nSmart Slippage:${smartSlippage ? '✅' : '⛔'}\nDegen Mode:${degenMode ? '✅' : '⛔'}\nMax Gas Price: Default (300gwei): Current :\nSlippage:Default(10%): Current :\n\n\n📌Buy\n\nAuto Buy${''}\nDouble Buy${''}\nBuy Gas Price:Default(25.82+3 gwei) :${''}\nMAx Market Cap :${''}\nMinimum Liquidity: ${''}\nMax Liquidity:${''}\nMax Buy Tax:Disabled\nMax Sell Tax:Disabled\n\n\n📌Sell\n\nAuto Sell:${''}\nTrailing Sell:${''}\nSell Gas Price:Default(25.82+3gewi): ${''}\nAuto Sell(high):Default(+100):${''}\nSell Amount(high):Default(+100):0\nAuto Sell(low):Default(-101%):${''}\nSell Amount(low):Default(+100%):${''}`
        return { content, userWalletDetails }
    } catch (error) {
        console.log("🚀 ~ file: commonUpdate.js:28 ~ contentCreateFunction ~ error:", error)
    }
}
// inlineKeyBoards
const afterConnectedInlineKeyboard = [
    [inline_keyboard_generate_object('Check Balance', 'checkBalance')],

    [inline_keyboard_generate_object("⚙️ Settings", "settings")],

    [
        inline_keyboard_generate_object("💰 Buy", "buy"),
        inline_keyboard_generate_object("💰 Sell", "sell")

    ],
    [inline_keyboard_generate_object("❗ Disconnect Wallet", "disconnectWallet")],
];

const settingsOptionChangesUpdate = async (userAddress) => {
    try {
        const { content, userWalletDetails } = await contentCreateFunction(userAddress)
        const { antiRug, smartSlippage, degenMode } = userWalletDetails
        //
        let contentUpdateInlineKeyboard = [
            [inline_keyboard_generate_object('Return 🔙', 'settingsReturn')],
            [
                inline_keyboard_generate_object(`${antiRug ? '✅' : '⛔'} Anti Rug`, 'antiRug'),
                inline_keyboard_generate_object(`${smartSlippage ? '✅' : '⛔'} Smart Slippage`, 'smartSlippage'),
            ],
            [inline_keyboard_generate_object(`${degenMode ? '✅' : '⛔'} Degen Mode`, 'degenMode')],
            [
                inline_keyboard_generate_object('🟢 Buy', 'buySettings'),
                inline_keyboard_generate_object('🔴 Sell', 'sellSettings')
            ],
            [
                inline_keyboard_generate_object('📝 Max Gas Price', 'maxGasPrice'),
                inline_keyboard_generate_object('🚫 Max Gas Price', 'resetMaxGasPrice')
            ],
            [
                inline_keyboard_generate_object('📝 Slippage', 'slippage'),
                inline_keyboard_generate_object('🚫 Slippage', 'resetSlippage')
            ],
            [
                inline_keyboard_generate_object('📝 Max Gas Limit', 'maxGasLimit'),
                inline_keyboard_generate_object('🚫 Max Gas Limit', 'resetMaxGasLimit')
            ],
        ]
        return { content, contentUpdateInlineKeyboard }
    } catch (error) {
        console.log("🚀 ~ settingsOptionChangesUpdate ~ error:", error)
        return false
    }
}
// buyTokenDetails

const buyTokenDetailsUpdatedAndInlineKeyboard = async (ctxMessage, filePath) => {
    try {
        const userDetails = await findeUserDetails(ctxMessage, filePath)
        if (!userDetails) {
            return false
        }
        const { tokenAddress, tokenName, tokenDecimals, tokenSymbol } = userDetails
        let content = `🔹Token Address\n${tokenAddress}\n🔹Current Price :${''}\n🔹Token Name :${tokenName}\n🔹Token Decimal :${tokenDecimals}\n🔹Token Symbol :${tokenSymbol}`
        let inline_keyboard = [
            [
                inline_keyboard_generate_object('Track', 'track'),
                inline_keyboard_generate_object(`ETH`, 'ETH'),
                inline_keyboard_generate_object(`God Mode`, 'godMode'),
            ],
            [
                inline_keyboard_generate_object(`Main`, 'main'),
                inline_keyboard_generate_object(`Buy🔄Sell`, 'buyTosell')
            ],
            [
                inline_keyboard_generate_object('Buy 0.0001ETH', 'buy_0.0001_ETH'),
                inline_keyboard_generate_object('Buy 0.0002ETH', 'buy_0.0002_ETH')
            ],
            [
                inline_keyboard_generate_object('Buy 0.0003ETH', 'buy_0.0003_ETH'),
                inline_keyboard_generate_object('Buy 0.0004ETH', 'buy_0.0004_ETH')
            ],
            [
                inline_keyboard_generate_object('Buy X ETH', 'buyXETH'),
                inline_keyboard_generate_object('Ape Max', 'ApeMax'),
                inline_keyboard_generate_object('Buy X Tokens', 'buyXTokens'), inline_keyboard_generate_object('Show Pop Up', 'showPopUp'),
            ]
        ]
        return { content, inline_keyboard }
    } catch (error) {
        console.log("🚀 ~ file: commonUpdate.js:116 ~ buyTokenDetailsUpdatedAndInlineKeyboard ~ error:", error)
        return false
    }
}
// sellTokenDetails
const sellTokenDetailsUpdatedAndInlineKeyboard = async (ctxMessage, filePath) => {
    try {
        const userDetails = await findeUserDetails(ctxMessage, filePath);
        if (!userDetails) {
            return false
        }
        const { tokenAddress, tokenName, tokenDecimals, tokenSymbol } = userDetails
        let content = `🔹Token Address\n${tokenAddress}\n🔹Current Price :${''}\n🔹Token Name :${tokenName}\n🔹Token Decimal :${tokenDecimals}\n🔹Token Symbol :${tokenSymbol}`
        let inline_keyboard = [
            [inline_keyboard_generate_object('Check Balance', 'checkBalance')],
            [inline_keyboard_generate_object('Return', "sellTobuy")],
            [
                inline_keyboard_generate_object('Auti Rug', 'autiRug'),
                inline_keyboard_generate_object(`Auto Sell`, 'autoSell'),
                inline_keyboard_generate_object(`Trailing Sell`, 'trailingSell'),
            ],
            [
                inline_keyboard_generate_object(`Sell🔄Buy`, 'sellTobuy'),
                inline_keyboard_generate_object(`Apporove`, 'approve'),
                inline_keyboard_generate_object(`Thershold`, 'sellThershold'),
            ],
            [
                inline_keyboard_generate_object(`Sell`, 'demo'),
                inline_keyboard_generate_object(`Sell X %`, 'sellWithPercentage'),
            ],
            [
                inline_keyboard_generate_object('25%', 'sellToken25'),
                inline_keyboard_generate_object('50%', 'sellToken50'),
                inline_keyboard_generate_object('75%', 'sellToken75'),
                inline_keyboard_generate_object('100%', 'sellToken100'),
            ],
            [
                inline_keyboard_generate_object('Sell X ETH', 'sellXETH'),
                inline_keyboard_generate_object('Sell Max Tx', 'ApeMax'),
                inline_keyboard_generate_object('Sell X Tokens', 'sellXTokens'),
            ]
        ]
        return { content, inline_keyboard }
    } catch (error) {
        console.log("🚀 ~ file: commonUpdate.js:160 ~ sellTokenDetailsUpdatedAndInlineKeyboard ~ error:", error)
        return false
    }
}
// buy Setting
const buySettingOptions = async (userAddress) => {
    try {
        const { content, userWalletDetails } = await contentCreateFunction(userAddress)
        const buySelectedOptionsInlineKeyBoard = [
            [inline_keyboard_generate_object("Return 🔙 ", "buyReturn")],
            [
                inline_keyboard_generate_object("✅ Double Buy", "doubleBuy"),
                inline_keyboard_generate_object("✅ Auto Buy", "autoBuy")
            ],
            [
                inline_keyboard_generate_object("✏️ Max Mc", "maxMc"),
                inline_keyboard_generate_object("🚫 Max Mc", "removeMaxMc"),
            ],
            [
                inline_keyboard_generate_object("✏️ Minimum Liquidity", "minimumLiquidity"),
                inline_keyboard_generate_object("🚫 Minimum Liquidity", "removeMinimumLiquidity")
            ],
            [
                inline_keyboard_generate_object("✏️ Max Buy Tax", "maxBuyTax"),
                inline_keyboard_generate_object("🚫 Max Buy Tax", "removeMaxBuyTax"),
            ],
            [
                inline_keyboard_generate_object("✏️ Max Sell Tax", "maxSellTax"),
                inline_keyboard_generate_object("🚫 Max Sell Tax", "removeMaxSellTax"),
            ],
            [
                inline_keyboard_generate_object("✏️ Gas Delta", "gasDelta"),
                inline_keyboard_generate_object("🚫 Gas Delta", "removeGasDelta"),
            ],
        ]
        return { content, buySelectedOptionsInlineKeyBoard }
    } catch (error) {
        console.log("🚀 ~ buySettingOptionsUpdate ~ error:", error)
        return false
    }
}
// sell Setting
const sellSettingOptions = async (userAddress) => {
    try {
        const { content, userWalletDetails } = await contentCreateFunction(userAddress)
        const buySelectedOptionsInlineKeyBoard = [
            [inline_keyboard_generate_object("Return 🔙 ", "sellReturn")],
            [
                inline_keyboard_generate_object("Double Buy", "doubleBuy"),
                inline_keyboard_generate_object("⚙️ Auto Buy", "autoBuy")
            ],
            [
                inline_keyboard_generate_object("✏️ Max Mc", "maxMc"),
                inline_keyboard_generate_object("🚫 Max Mc", "removeMaxMc"),
            ],
            [
                inline_keyboard_generate_object("✏️ Minimum Liquidity", "minimumLiquidity"),
                inline_keyboard_generate_object("🚫 Minimum Liquidity", "removeMinimumLiquidity")
            ],
            [
                inline_keyboard_generate_object("✏️ Max Buy Tax", "maxBuyTax"),
                inline_keyboard_generate_object("🚫 Max Buy Tax", "removeMaxBuyTax"),
            ],
            [
                inline_keyboard_generate_object("✏️ Max Sell Tax", "maxSellTax"),
                inline_keyboard_generate_object("🚫 Max Sell Tax", "removeMaxSellTax"),
            ],
            [
                inline_keyboard_generate_object("✏️ Gas Delta", "gasDelta"),
                inline_keyboard_generate_object("🚫 Gas Delta", "removeGasDelta"),
            ],
        ]
        return { content, buySelectedOptionsInlineKeyBoard }
    } catch (error) {
        console.log("🚀 ~ buySettingOptionsUpdate ~ error:", error)
        return false
    }
}
// 
const buyConfirmAndCancelOptionInlineKeyBoard = () => {
    const inline_keyboard = [
        [
            inline_keyboard_generate_object("🚫 Cancel", "buyCancelOrder"),
            inline_keyboard_generate_object("Confirm Buy", "confirmBuy")
        ]
    ]
    return { inline_keyboard }
}
// 
const sellConfirmAndCancelOptionInlineKeyBoard = () => {
    const inline_keyboard = [
        [
            inline_keyboard_generate_object("🚫 Cancel", "sellCancelOrder"),
            inline_keyboard_generate_object("Confirm Sell", "confirmSell")
        ]
    ]
    return { inline_keyboard }
}


module.exports = { settingsOptionChangesUpdate, findeUserDetails, afterConnectedInlineKeyboard, buySettingOptions, sellSettingOptions, buyTokenDetailsUpdatedAndInlineKeyboard, buyConfirmAndCancelOptionInlineKeyBoard, sellTokenDetailsUpdatedAndInlineKeyboard, sellConfirmAndCancelOptionInlineKeyBoard }