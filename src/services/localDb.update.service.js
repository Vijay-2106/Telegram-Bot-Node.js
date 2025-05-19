const fs = require('fs')
const path = require('path')
const fsPromises = require('fs/promises')
// const filePath = path.join(__dirname, '..', 'db', 'data.json')

module.exports = {
    connectedString: 'connected',
    localDBCreate: async () => {
        if (!fs.existsSync(path.join(__dirname, '..', 'db'))) {
            await fs.mkdirSync(path.join(__dirname, '..', 'db'))
            await fsPromises.writeFile(path.join(__dirname, '..', 'db', 'data.json'), JSON.stringify([]))
        }
    },
    fsReadFile: async (filePath) => {
        const readData = await fsPromises.readFile(filePath)
        return await JSON.parse(readData)
    },
    fsWriteFile: async (filePath, data) => {
        await fsPromises.writeFile(filePath, JSON.stringify(data))
    },
    useState: (initialState) => {
        let state = initialState
        let setState = (updateValue) => {
            state = updateValue
        }
        return [state, setState]
    },
    userDetailsUpdateLocalDB: async (chatId, filePath, tokenAddress, currentStatus, amount) => {
        try {
            let localDBData = await fsPromises.readFile(filePath)
            localDBData = JSON.parse(localDBData)
            const userIndex = localDBData?.findIndex((user) => user.chat_id == chatId)
            const userDetails = localDBData?.find((user) => user.chat_id == chatId)
            localDBData[userIndex].currentStatus = currentStatus ? currentStatus : userDetails?.currentStatus
            localDBData[userIndex].tokenAddress = tokenAddress ? tokenAddress : userDetails?.tokenAddress
            localDBData[userIndex].amount = amount ? amount : 0
            await fsPromises.writeFile(filePath, JSON.stringify(localDBData))
            return true
        } catch (error) {
            console.log("🚀 ~ userDetailsUpdate: ~ error:", error)
            return false
        }
    }
}


