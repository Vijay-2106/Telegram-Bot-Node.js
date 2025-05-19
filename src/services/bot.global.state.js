const { useState } = require('./localDb.update.service')

// global states

const [deleteMessage, setDeleteMessage] = useState([])

module.exports = { deleteMessage, setDeleteMessage }