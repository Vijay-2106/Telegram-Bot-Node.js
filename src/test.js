const commonService = require("./services/common.service");

const web3Provider = commonService.web3Provider()

const ll = web3Provider.utils.toChecksumAddress('0xd15712Ab3337173bf3b0E60976cd3378341EAE71')
console.log("🚀 ~ web3Provider:", ll)
const original = {
    name: 'vijay',
    age: 20
}
// console.log("🚀 ~ original:above", original)

const check = async () => {
    const receipt = await web3Provider.eth.getTransactionReceipt('0x36942e88532f4377ca4ebc65ef871b535df7e7a72dbc20aa9f9a412d3d440904')
    console.log("🚀 ~ receipt:", receipt)
}
// check()
const changeUpdate = async (name, age) => {
    userTokenDetailsInitiallyCreateArray('')
    // changeUpdate('ajith', '_')
    await userTokenDetailsInitiallyCreateArray('0xd15712Ab3337173bf3b0E60976cd3378341EAE71')
}

// changeUpdate()

function writePromise() {
    return new Promise((resolve, reject) => {
        try {
            if (true) {
                resolve('Hello There')
            } else {
                reject('Sorry Bro')
            }
        } catch (error) {
        }
    })
}

const checkPrimise = () => {
    writePromise().then((res) => {
        console.log("🚀 ~ file: test.js:38 ~ writePromise ~ res:", res)
    }).catch((err) => {
        console.log("🚀 ~ file: test.js:40 ~ writePromise ~ err:", err)

    })
}


checkPrimise()