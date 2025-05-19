const commonService = require('./common.service')
const TOKEN_ABI = require('../abiArray/tokenAbi.json')
const CONTRACT_ABI = require('../abiArray/contractAbi.json')
const contractAddressDetails = require('../contract/contract.address.json')
// 
const { deleteMessage, setDeleteMessage } = require('../services/bot.global.state')
const web3Provider = commonService.web3Provider()
const { WETH, routerContract } = contractAddressDetails
const { swapUserHistoryCreate, swapHistoryStatusUpdate } = require('./mongo.queries.common')
const { ctxServerSlowMessage } = require('./bot.method')

// function start
const tokenContractInstanceCreate = (tokenAddress) => {
    try {
        const tokenContractInstance = new web3Provider.eth.Contract(TOKEN_ABI, tokenAddress)
        return tokenContractInstance
    } catch (error) {
        console.log("🚀 ~ tokenContractInstanceCreate ~ error:", error)
        return false
    }
}
// 
const contractInstanceCreate = () => {
    try {
        const contractInstance = new web3Provider.eth.Contract(CONTRACT_ABI, routerContract)
        return contractInstance
    } catch (error) {
        console.log("🚀 ~ tokenContractInstanceCreate ~ error:", error)
        return false
    }
}
//
const userReceivedAmountFindMethod = async (amount, tokenAddress, status) => {
    try {
        const RouterContractInstance = contractInstanceCreate()
        const amountToSend = await web3Provider.utils.toWei(amount.toString(), "ether");
        let GetAmountOut
        if (status == 'buy') {
            GetAmountOut = await RouterContractInstance.methods
                .getAmountsOut(amountToSend, [WETH, tokenAddress])
                .call();
        } else if (status == 'sell') {
            GetAmountOut = await RouterContractInstance.methods
                .getAmountsOut(amountToSend, [tokenAddress, WETH])
                .call();
        }
        const spendAmount = await web3Provider.utils.fromWei(GetAmountOut[0], 'ether')
        const receiveAmount = await web3Provider.utils.fromWei(GetAmountOut[1], 'ether')
        return { spendAmount, receiveAmount, amountInToWeiFormat: GetAmountOut, status: true }
    } catch (error) {
        console.log("🚀 ~ getAmountsOut ~ error:", error)
        return { status: false }
    }
}
// 
const getTokenDetails = async (tokenContractIns) => {
    try {
        const tokenData = {}
        tokenData.name = await tokenContractIns.methods.name().call();
        tokenData.totalSupply = await tokenContractIns.methods.totalSupply().call()
        tokenData.decimals = await tokenContractIns.methods.decimals().call();
        tokenData.symbol = await tokenContractIns.methods.symbol().call()
        tokenData.decimals = parseFloat(tokenData.decimals)
        tokenData.totalSupply = parseInt(web3Provider.utils.fromWei(tokenData.totalSupply, 'ether'))
        return tokenData
    } catch (error) {
        console.log("🚀 ~ getTokenDetails ~ error:", error)
    }
}
// 
const getUserBalance = async (userAddress) => {
    try {
        const getBalance = await web3Provider.eth.getBalance(userAddress)
        const userBalance = web3Provider.utils.fromWei(getBalance, 'ether')
        return userBalance
    } catch (error) {
        console.log("🚀 ~ getUserBalance ~ error:", error)
        return false
    }
}
// 
const getUserTokenAllowance = async (tokenAddress, userAddress) => {
    try {
        const tokenInstance = tokenContractInstanceCreate(tokenAddress)
        const userAllowance = await tokenInstance.methods.allowance(userAddress, routerContract).call()
        const fromWeiAllowance = await web3Provider.utils.fromWei(userAllowance, 'ether')
        return fromWeiAllowance
    } catch (error) {
        console.log("🚀 ~ getUserTokenAllowance ~ error:", error)
    }
}
// getToken Balance
const getTokenBalance = async (tokenAddress, userAddress) => {
    try {
        const tokenContractInstance = tokenContractInstanceCreate(tokenAddress)
        const tokenBalance = await tokenContractInstance.methods.balanceOf(userAddress).call()
        return await web3Provider.utils.fromWei(tokenBalance, 'ether')
    } catch (error) {
        console.log("🚀 ~ file: web3.service.js:65 ~ getTokenBalance ~ error:", error)
        return false
    }
}
// 
const buyETHtoToken = async (ctx, userAddress, privateKey, tokenAddress, message_id, fromCurrency, toCurrency, spendAmount, receiveAmount) => {
    try {
        const RouterContractInstance = contractInstanceCreate()
        const amountToSend = await web3Provider.utils.toWei(spendAmount.toString(), "ether");
        console.log("🚀 ~ buyETHtoToken ~ amountToSend:", amountToSend)
        const deadline = commonService.deadline
        const nonce = await web3Provider.eth.getTransactionCount(userAddress);
        const gasPrices = await web3Provider.eth.getGasPrice();
        const block = await web3Provider.eth.getBlock("latest");
        console.log("🚀 ~ buyETHtoTokenStaticAmount ~ block:", block.gasLimit)
        const decodePrivateKey = commonService.decryption(privateKey)
        console.log("🚀 ~ buyETHtoTokenStaticAmount ~ decodePrivateKey:", decodePrivateKey)
        const data = await RouterContractInstance.methods
            .swapExactETHForTokens(0, [WETH, tokenAddress], userAddress, deadline)
            .encodeABI();
        const tx = {
            from: userAddress,
            to: routerContract,
            value: amountToSend,
            gas: 300000,
            gasPrice: gasPrices,
            data: data,
            nonce: nonce,
        };
        setDeleteMessage(deleteMessage.push(message_id))
        web3Provider.eth.accounts
            .signTransaction(tx, decodePrivateKey)
            .then((signedTx) => {
                web3Provider.eth
                    .sendSignedTransaction(signedTx.rawTransaction)
                    .on("transactionHash", async (hash) => {
                        console.log("🚀 ~ file: web3.service.js:106 ~ .on ~ hash:", hash)
                        const response = await swapUserHistoryCreate(userAddress, hash, tokenAddress, fromCurrency, toCurrency, spendAmount, receiveAmount, 'buy')
                        if (!response) {
                            return await ctxServerSlowMessage(ctx)
                        }
                        const formattedDate = new Date().toLocaleString("en-IN", {
                            timeZone: "UTC",
                        });
                        const message = `Your Transaction Hash\nClick To Check Your Status : <a href="https://sepolia.etherscan.io/tx/${hash}">View Transaction</a>`;
                        await ctx.reply(message, { parse_mode: 'html' });
                    })
                    .on('receipt', async (receipt) => {
                        console.log("🚀 ~ file: web3.service.js:119 ~ .on ~ receipt:", receipt?.status)
                        try {
                            if (!receipt?.status) {
                                await swapHistoryStatusUpdate(receipt?.transactionHash, 'failed')
                            } else {
                                await swapHistoryStatusUpdate(receipt?.transactionHash, 'success')
                            }

                        } catch (error) {
                            console.log("🚀 ~ file: web3.service.js:124 ~ .on ~ error:", error)
                            return ctxServerSlowMessage(ctx)
                        }
                    })
                    .catch(async (error) => {
                        console.log("🚀 ~ .then ~ err:", err)
                        await ctx.reply(`Your Transaction Failed \n\nReason\n${error.message}`)

                    })
            })
            .catch(async (error) => {
                console.error("Error signing the transaction:", error);
                return await ctx.reply(`Your Transaction Failed \n\nReason\n${error.message}`)

            });
    } catch (error) {
        console.log("🚀 ~ buyETHtoToken ~ error:", error)
        await ctx.reply(`Your Transaction Failed \n\nReason\n${error.message}`)
        return false
    }
}
// 
const sellTokenToETH = async (ctx, userAddress, privateKey, tokenAddress, sellPercentage, message_id, fromCurrency, toCurrency, spendAmount, receiveAmount) => {
    try {
        const userAllowance = await getUserTokenAllowance(tokenAddress, userAddress)
        if (userAllowance < spendAmount) {
            return ctx.reply('Allowance is Low .Please Approved Your Token')
        }
        const RouterContractInstance = contractInstanceCreate()
        const amountToSend = web3Provider.utils.toWei(spendAmount, "ether");
        const deadline = commonService.deadline
        const estimatGasLimit = await RouterContractInstance.methods.swapExactTokensForETH(amountToSend, 0, [tokenAddress, WETH], userAddress, deadline).estimateGas({ from: userAddress })
        console.log("🚀 ~ sellTokenToETH ~ estimatGasLimit:", estimatGasLimit)
        const nonce = await web3Provider.eth.getTransactionCount(userAddress);
        const gasPrice = await web3Provider.eth.getGasPrice();
        const decodePrivateKey = commonService.decryption(privateKey)
        const data = await RouterContractInstance.methods.swapExactTokensForETH(amountToSend, 0, [tokenAddress, WETH], userAddress, deadline).encodeABI()
        const tx = {
            from: userAddress,
            to: routerContract,
            value: 0,
            gas: estimatGasLimit,
            gasPrice: gasPrice,
            data: data,
            nonce: nonce,
        };
        setDeleteMessage(deleteMessage.push(message_id))
        web3Provider.eth.accounts
            .signTransaction(tx, decodePrivateKey)
            .then((signedTx) => {
                web3Provider.eth
                    .sendSignedTransaction(signedTx.rawTransaction)
                    .on("transactionHash", async (hash) => {
                        console.log("🚀 ~ .on ~ hash:", hash)
                        const response = await swapUserHistoryCreate(userAddress, hash, tokenAddress, fromCurrency, toCurrency, spendAmount, receiveAmount, 'sell', sellPercentage)
                        if (!response) {
                            return await ctxServerSlowMessage(ctx)
                        }
                        const formattedDate = new Date().toLocaleString("en-IN", {
                            timeZone: "UTC",
                        });
                        const message = `Your Transaction Hash\nClick To Check Your Status : <a href="https://sepolia.etherscan.io/tx/${hash}">View Transaction</a>
                          `;
                        // Amount Received for Given Amount: GetAmountOut[1].toString()
                        await ctx.reply(message, { parse_mode: 'html' });
                    })
                    .on('receipt', async (receipt) => {
                        console.log("🚀 ~ .on ~ receipt:", receipt?.status)
                        try {
                            if (!receipt?.status) {
                                await swapHistoryStatusUpdate(receipt?.transactionHash, 'failed')
                            } else {
                                await swapHistoryStatusUpdate(receipt?.transactionHash, 'success')
                            }
                        } catch (error) {
                            console.log("🚀 ~ file: web3.service.js:124 ~ .on ~ error:", error)
                            return ctxServerSlowMessage(ctx)
                        }
                    })
                    .catch(async (err) => {
                        console.log("🚀 ~ .then ~ err:", err)
                        await ctx.reply(`Your Transaction Failed \n\nReason\n${err.message}`)
                    })
            })
            .catch(async (error) => {
                console.error("Error signing the transaction:", error);
                return await ctx.reply(`Your Transaction Failed \n\nReason\n${error.message}`)
            });
    } catch (error) {
        console.log("🚀 ~ sellTokenToETH ~ error:", error)
        return await ctx.reply(`Your Transaction Failed \n\nReason\n${error.message}`)
    }
}
// 
const tokenApproved = async (ctx, amount, userAddress, privateKey, tokenAddress, message_id) => {
    try {
        const setTokenAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        const TokenContractInstance = tokenContractInstanceCreate(tokenAddress)
        const userAllowance = await getUserTokenAllowance(tokenAddress, userAddress)
        if (Number(userAllowance) < Number(amount)) {
            const nonce = await web3Provider.eth.getTransactionCount(userAddress);
            const gasPrices = await web3Provider.eth.getGasPrice();
            const decodePrivateKey = commonService.decryption(privateKey)
            console.log("🚀 ~ buyETHtoTokenStaticAmount ~ decodePrivateKey:", decodePrivateKey)
            const data = await TokenContractInstance.methods
                .approve(routerContract, setTokenAmount)
                .encodeABI();
            const tx = {
                from: userAddress,
                to: tokenAddress,
                value: '0',
                gas: 300000,
                gasPrice: gasPrices,
                data: data,
                nonce: nonce,
            };
            web3Provider.eth.accounts
                .signTransaction(tx, decodePrivateKey)
                .then((signedTx) => {
                    console.log("🚀 ~ file: web3.service.js:171 ~ .then ~ signedTx:", signedTx)
                    web3Provider.eth
                        .sendSignedTransaction(signedTx.rawTransaction)
                        .on("transactionHash", async (hash) => {
                            console.log("🚀 ~ file: web3.service.js:175 ~ .on ~ hash:", hash)
                            const message = `Approved Success✅\nTransaction Hash: <a href="https://sepolia.etherscan.io/tx/${hash}">View Transaction </a>`;
                            await ctx.reply(message, { parse_mode: 'html' });
                        })
                        .on('receipt', (receipt) => {
                            console.log("🚀 ~ file: web3.service.js:179 ~ .on ~ receipt:", receipt)
                        })
                        .catch(async (err) => {
                            console.log("🚀 ~ .catch ~ err:", err)
                            await ctx.reply(`Your Transaction Failed \n\nReason\n${err.message}`)
                        })
                })
                .catch((error) => {
                    console.error("Error signing the transaction:", error);
                    return ctx.reply('Something Went Wrong ETH to Token Buy')
                });
        } else {
            console.log("☮️  ~Already Token Approved:")
            await ctx.reply(`Your Are Enough Allowance.No Need Approved`)
        }
    } catch (error) {
        console.log("🚀 ~ buyETHtoToken ~ error:", error)
        return false
    }
}


module.exports = { tokenContractInstanceCreate, getTokenDetails, contractInstanceCreate, getUserBalance, buyETHtoToken, getTokenBalance, tokenApproved, sellTokenToETH, userReceivedAmountFindMethod }