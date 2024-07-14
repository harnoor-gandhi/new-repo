
const axios = require('axios');
const mongoose = require("mongoose");
const {ObjectId} = mongoose.Types;
// mongoose.set('debug', true);


const {
    isPROD, isProdBackeURL, isDevBackeURL, isLocalBackeURL,
    CLIENT_ID, TENANT_ID, CLIENT_SECRET, GRAPH_ENDPOINT, AAD_ENDPOINT,
    useDB_PROD,
    DB_ONBOARDING, 
    DB_ONBOARDING_DOC_USERS, DB_USERS,
    DB_ONBOARDING_DOC_BOARDS, DB_BOARDS,
    DB_ONBOARDING_DOC_PROJECTS, DB_PROJECTS,
    JIRA_DOMAIN_URL, SECURITY_TOKEN, DB_EPICS, DB_ISSUES, 
    // ProdDB, CLOUD_INSTANCE
} = require('../backendHttpTrigger/credsStore');


const myDB = mongoose.connection.useDb(useDB_PROD);

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue){
        console.log('JavaScript is running late!');
    }
    console.log("Worklogs start")

    try{
        let server = (isPROD == "PROD" ? isProdBackeURL: (isPROD == "DEV" ? isDevBackeURL:isLocalBackeURL) );

        const USERISSUEREQUEST = await axios.post(`${server}/api/orchestrators?type=DEPARTMENTS`, {}).then(response => {
            // console.log('Response:', response.data.status.body.statusQueryGetUri);
            return response.data;
        })

        const ONBOARDING_USERSUPDATE = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_USERS }, {
            $set: {"hour.bulkDepartment":timeStamp}
        });

        // console.log('JavaScript timer trigger function ran!', timeStamp);
        return {success:true, done:USERISSUEREQUEST} 
    }catch(err){

        // console.log('err', err)
        const ONBOARDING_USERSUPDATE = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_USERS }, {
            $push: {"hour.errorDepartment":"err: " + JSON.stringify(err)}
        });

        return {success:false, error:err}
    }  
};