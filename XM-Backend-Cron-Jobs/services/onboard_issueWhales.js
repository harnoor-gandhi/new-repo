
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
} = require('./../backendHttpTrigger/credsStore');

const {
    getAllMyIssues
} = require('./reusable-functions/process_issues');


const myDB = mongoose.connection.useDb(useDB_PROD);
      

module.exports = {
    onboardJiraIssues: async function(via){
        console.log({hits:true, via:via})
        if(via !== 'CREATED' && via !== 'MANUALY' && via !== 'SCHEDULED'){
            return ({status:false, err: "You don't know what your doing, please consider proper training!"})
        }else{
            let doneViaSINGLE = 0;
            let processPerHour = 20; // stretch it based jira api ie:10/s


            const ONBOARDING_USERS = await myDB.collection(DB_ONBOARDING).findOne({tag: DB_ONBOARDING_DOC_USERS });
            const UserJiraX = JSON.parse(JSON.stringify(ONBOARDING_USERS));
            // const UserJiraUIDS = [UserJiraUIDSX[0]];
            const hourissue = UserJiraX.hour?.issueWhales || 0; // this will be from 0-24 based on 24h per day
            const timesCount = UserJiraX.hour?.issueTimeWhales || 0;
            const dividedArray = await divideArray((UserJiraX.jiraOver1000UIDS || []), processPerHour);
            const UserJiraUIDS = dividedArray[hourissue] || [];
            // const UserJiraUIDS = ["611ba5b8aee32f006f8eff45"];
            let howLong = dividedArray?.length || 0;
            await shiftNEXTUID(hourissue, howLong, timesCount)


            if(UserJiraUIDS.length == 0){
                return ({ status: true, info:"NO UIDS FOR WHALES" })
            }else{
                let sleepStart = 1;

                

                for (let s = 0; s < UserJiraUIDS.length; s++) {
                    // const jiraID = "641992310e6828ab2025df10"; // DipTEST
                    // const jiraID = UserJiraUIDS[1];
                    const jiraID = UserJiraUIDS[s];
                    console.log('jid: ', UserJiraUIDS[s])
                    // const jiraID = accountID; of jira

                        // call function here to update fish users
            const issueProcess = await getAllMyIssues(via, "SINGLE", jiraID, hourissue, processPerHour, dividedArray.length, "WHALES")

            doneViaSINGLE++
            sleepStart--;
            if(sleepStart == 0){
                sleepStart = 1;
                await sleep(1000);
            }
    
    
    if(UserJiraUIDS.length == (s+1)){ // we need to wait for serval then trigger this
        console.log('DONE WHALES ISSUE', doneViaSINGLE, UserJiraUIDS.length)
        return ({ status: true, process:issueProcess})
    }
    
    
    
                    }


            }



        }

    }
}



function divideArray(array, size) {
    const dividedArray = [];
    for (let i = 0; i < array.length; i += size) {
      dividedArray.push(array.slice(i, i + size));
    }
    return dividedArray;
}
// Helper function to create a delay using Promises
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function shiftNEXTUID(hourissue, howLong, timesCount){
    const ONBOARDING_USERSUPDATE = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_USERS }, {
        $set: {
            "hour.issueWhales":(hourissue >= howLong ? 0:(hourissue+1)),
            "hour.issueTimeWhales":(timesCount + 1),
            "hour.issueTotalWhales":howLong
        }
    });
    return ONBOARDING_USERSUPDATE
}