const express=require('express');
const router = express.Router();
const mongoose = require("mongoose");
const {ObjectId} = mongoose.Types;

const nodemailer = require("nodemailer");


const {
    CLIENT_ID, TENANT_ID, CLIENT_SECRET, GRAPH_ENDPOINT, AAD_ENDPOINT,
    useDB_PROD, 
    DB_ONBOARDING, 
    DB_ONBOARDING_DOC_USERS, DB_USERS,
    DB_ONBOARDING_DOC_BOARDS, DB_BOARDS,
    DB_ONBOARDING_DOC_PROJECTS, DB_PROJECTS,
    
    JIRA_DOMAIN_URL, SECURITY_TOKEN, DB_EPICS, DB_ISSUES, DB_USER_WORKLOGS,
    DB_ONBOARDING_DOC_SKILLS, 
    // ProdDB, CLOUD_INSTANCE
} = require('./credsStore');

        
const myDB = mongoose.connection.useDb(useDB_PROD);





router.get('/one',async (req, res) => {
    const transporter = await  nodemailer.createTransport({
        host: 'outlook.office365.com', //outlook.office365.com
        port: 587, // IMAP SSL port for Outlook
        secureConnection: false, // TLS requires secureConnection to be false
        secure: false, // true for 465, false for other ports
        tls: {
           ciphers:'SSLv3'
        },
        auth: {
          user: 'xm.support@cloudeq.com', // Your Outlook email address
          pass: 'Manager@13ab', // Your Outlook email password or app password
        //   type: 'PLAIN', // Explicitly specify authentication type
        },
      });


    //   transporter.search(['UNSEEN'], (err, emails) => {
    //     if (err) {
    //       console.error('Error searching for emails:', err);
    //     } else {
    //       console.log('Found emails:', emails);
    //     }
    //   });
            
      const mailOptions = {
        from: 'xm.support@cloudeq.com',
        to: 'dipeshbhoir@hotmail.com',
        subject: 'Test Email',
        text: 'This is a test email from Nodemailer.',
      };
      
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Error sending email:', err);
          res.json(false)
        } else {
          console.log('Email sent:', info.response);
          res.json(true)
        }
      });

}) // test route

module.exports = router;