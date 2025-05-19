// //packages
// const nodemailer = require("nodemailer");
// const mongoose = require("mongoose");

// //models
// const sitesettingModel = require("../models/gnittesetis.model");
// const emailtempModel = require("../models/pmetliame.model");

// //files require
// const smtp = require("../configration/c210cA");
// const commonService = require("../services/common.service");
// const commonConfigration = require("../configration/common");

// var transporter = nodemailer.createTransport({
//     host: commonService.decryption(smtp.host),
//     port: commonService.decryption(smtp.port),
//     auth: {
//         user: commonService.decryption(smtp.username),
//         pass: commonService.decryption(smtp.password)
//     }
// });

// module.exports = {
//     sendMail: (to, tempName, specialVar, callback) => {
//         emailtempModel.find({ "title": tempName }).then(tempcontent => {
//             sitesettingModel.find({}).then(siteContent => {
//                 var site_info = {
//                     '###LOGO###': siteContent[0].site_logo,
//                     '###SITE_NAME###': siteContent[0].site_name,
//                     '###SITEURL###': commonConfigration.frontend_url,
//                     '###COPY_RIGHTS###': siteContent[0].copy_rights
//                 }
//                 var specialVars = Object.assign(specialVar, site_info);
//                 var subject = tempcontent[0].mail_subject;
//                 var html = tempcontent[0].mail_content;
//                 for (var key in specialVars) {
//                     if (specialVars.hasOwnProperty(key)) {
//                         subject = subject.replace(key, specialVars[key]);
//                     }
//                 }
//                 for (var key in specialVars) {
//                     if (specialVars.hasOwnProperty(key)) {
//                         html = html.replace(key, specialVars[key])
//                     }
//                 }
//                 let mailOptions = {
//                     from: commonService.decryption(smtp.from),
//                     to: to,
//                     subject: subject,
//                     html: html
//                 };
//                 transporter.sendMail(mailOptions, function (error, info) {
//                     if (error) {
//                         console.log('error ' + error);
//                     } else {
//                         callback(true);
//                     }
//                 });
//             }).catch(siteContentError => {
//                 console.log('siteContentError ' + siteContentError.message);
//             })
//         }).catch(tempError => {
//             console.log('tempError ' + tempError.message);
//         })
//     }
// }
