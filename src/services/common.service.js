const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const ip = require("ip");
const fs = require("fs");
const getPixels = require("get-pixels");
const { IP2Proxy } = require("ip2proxy-nodejs");
let ip2proxy = new IP2Proxy();

const common = require("../configration/common");
const responseApi = require("./responseApi");

const key = CryptoJS.enc.Base64.parse("HmasdsadfVfidjgay");
const iv = CryptoJS.enc.Base64.parse("Wntkrofwdsgi");
// 
const Web3 = require("web3").Web3

const rpcUrl = 'https://1rpc.io/sepolia'

module.exports = {
    deadline: Math.floor(Date.now() / 1000) + 60 * 60,
    web3Provider: () => {
        var web3Provider = new Web3(new Web3.providers.HttpProvider(rpcUrl))
        return web3Provider
    },
    encryption: (value) => {
        const cipher = CryptoJS.AES.encrypt(value, key, { iv: iv }).toString();
        return cipher;
    },
    decryption: (value) => {
        // const data = CryptoJS.enc.Base64.parse(value).toString(CryptoJS.enc.Utf8);
        const decipher = CryptoJS.AES.decrypt(value, key, { iv: iv });
        const decrypt_val = decipher.toString(CryptoJS.enc.Utf8);
        return decrypt_val;
    },
    admin_payload: (key) => {
        const payload = { subject: key };
        const token = jwt.sign(payload, common.admin_jwtToken);
        return token;
    },
    get_ipAddress: (req) => {
        var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        ip = ip.replace('::ffff:', '');
        ip = ip.split(",")
        ip = ip[0];
        return ip;
    },
    origin_middleware: (req, res, next) => {
        try {
            fs.readFile("./configration/b3JpZ2luX2NoZWNr.js", "utf8", (error, origin_data) => {
                if (!error && origin_data) {
                    var origin = req.headers['origin'];
                    const check_origin = origin_data.includes(origin)
                    if (check_origin == true) {
                        next();
                    } else {
                        return res.json(responseApi.error_response("Unauthorized Request!", `${origin}`, res.statusCode));
                    }
                } else {
                    return res.json(responseApi.error_response("Server Error", `${origin}`, res.statusCode));
                }
            })
        } catch (error) {
            return res.json(responseApi.error_response(error.message, {}, res.statusCode));
        }
    },
    admin_tokenMiddleware: (req, res, next) => {
        const token = req.headers["authorization"].split(" ")[1];
        if (!token || token == null || token == "") {
            return res.json(responseApi.error_response("Unauthorized Request!", {}, res.statusCode));
        } else {
            jwt.verify(token, common.admin_jwtToken, (error, user) => {
                if (!error && user) {
                    req.user = user;
                    next();
                } else {
                    return res.json(responseApi.error_response("Invalid Token", {}, res.statusCode));
                }
            })
        }
    },
    ramdom_otp: () => {
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    },
    user_payload: (key) => {
        const payload = { subject: key };
        const token = jwt.sign(payload, common.user_jwtToken);
        return token;
    },
    user_tokenMiddleware: (req, res, next) => {
        const token = req.headers["authorization"].split(" ")[1];
        if (!token || token == null || token == "") {
            return res.json(responseApi.error_response("Unauthorized Request!", {}, res.statusCode));
        } else {
            jwt.verify(token, common.user_jwtToken, (error, user) => {
                if (!error && user) {
                    req.user = user;
                    next();
                } else {
                    return res.json(responseApi.error_response("Invalid Token", {}, res.statusCode));
                }
            })
        }
    },
    ramdom_password: () => {
        var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
        let pass = '';
        for (let i = 1; i <= 8; i++) {
            let char = Math.floor(Math.random()
                * str.length + 1);
            pass += str.charAt(char)
        }
        return pass;
    },
    file_check: async (req, res, next) => {
        try {
            const image = req.file;
            const size = image.size / 1024 / 1024;
            const imageType = image.mimetype;

            if (imageType != "image/png" && imageType != "image/jpg" && imageType != "image/jpeg") {
                return res.status(400).json(responseApi.error_response("Invalid image formate", {}, res.statusCode));
            } else {
                if (size < 2) {
                    getPixels(req.file.path, async function (err, pixels) {
                        if (!err && pixels) {
                            next()
                        } else {
                            return res.status(400).json(responseApi.error_response("Invalid Formate", {}, res.statusCode));
                        }
                    })
                } else {
                    return res.status(400).json(responseApi.error_response("Upload image should be less than 2MB", {}, res.statusCode));
                }
            }
        } catch (error) {
            return res.status(400).json(responseApi.error_response(error.message, {}, res.statusCode));
        }
    },
    proxy_check: (req, res, next) => {
        try {
            var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
            ip = ip.replace('::ffff:', '');
            ip = ip.split(",")
            ip = ip[0];

            if (ip == "::1") {
                next()
            } else if (ip2proxy.open("./ksasdjkfhiuwa.bin/IP2PROXY-IP-PROXYTYPE-COUNTRY-REGION-CITY-ISP-DOMAIN-USAGETYPE-ASN-LASTSEEN-THREAT-RESIDENTIAL-PROVIDER.BIN") == 0) {
                if (ip2proxy.isProxy(ip) == 0) {
                    next();
                } else {
                    return res.status(400).json(responseApi.error_response("Your device is forbidden!", {}, res.statusCode));
                }
                ip2proxy.close();
            }
            else {
                return res.status(400).json(responseApi.error_response("Your device is forbidden!", {}, res.statusCode));
            }
        } catch (error) {
            return res.status(400).json(responseApi.error_response(error.message, {}, res.statusCode));
        }
    },
    grrtverfy: (req, res, next) => {
        if (req.headers['someNameOfHeader'] && req.headers['someNameOfHeader']) {
            const tokne = req.headers['someNameOfHeader'];
            const sjgetI = req.headers['someNameOfHeader'];

            const apikey = CryptoJS.enc.Base64.parse("");
            const apiiv = CryptoJS.enc.Base64.parse("");
            const decipher = CryptoJS.AES.decrypt(sjgetI, apikey, { iv: apiiv });
            const htht = decipher.toString(CryptoJS.enc.Utf8);

            // const htht = grrtverfy_decode(sjgetI);
            var url = req.protocol + '://' + req.get('host') + req.originalUrl;

            jwt.verify(tokne, url + '/' + htht, (err, payload) => {
                if (!err && payload) {
                    next();
                } else {
                    return res.json(responseApi.error_response("Invalid Key!", {}, res.statusCode));
                }
            })
        } else {
            return res.json(responseApi.error_response("Unauthorized Value!", {}, res.statusCode));
        }
    }
};


