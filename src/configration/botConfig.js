// const TelegramBot = require('node-telegram-bot-api');
// const token = require('./telegrambotToken')
// const bot = new TelegramBot(token.MY_TOKEN, { polling: true })

const { Telegraf } = require("telegraf");
const telegramToken = require("../configration/telegrambotToken");
const bot = new Telegraf(telegramToken.MY_TOKEN);


module.exports = bot
