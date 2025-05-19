
module.exports = {
    inline_keyboard_generate_object: (text, callback_data) => {
        const generateData = { text, callback_data }
        return generateData
    },
    ctxReplyWithKeyboardButton: async (ctx, text, inlineKeyboard) => {
        await ctx.reply(text, {
            reply_markup: { inline_keyboard: inlineKeyboard },
            parse_mode: 'html'
        });
    },
    ctxEditMessageText: async (ctx, chat_id, message_id, text, inlineKeyboard) => {
        await ctx.editMessageText(text, {
            message_id, chat_id,
            reply_markup: { inline_keyboard: inlineKeyboard }
        });
    },
    ctxServerSlowMessage: async (ctx, options = '') => {
        await ctx.reply(`Something Went Wrong Or Server Slow ${options}`)
    },
    ctxTransactionWaitingMessage: async (ctx) => {
        await ctx.reply('Transaction is processing, please wait…')
    },
    ctxTransactionCancelMessage: async (ctx, options = null) => {
        await ctx.reply(`Your Transaction Would Be Cancelled `)
    }
}

