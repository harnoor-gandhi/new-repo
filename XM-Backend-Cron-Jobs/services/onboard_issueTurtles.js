
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
            let doneViaSCARCED = 0;
            let processPerHour = 20; // stretch it based jira api ie:10/s


            const ONBOARDING_USERS = await myDB.collection(DB_ONBOARDING).findOne({tag: DB_ONBOARDING_DOC_USERS });
            const UserJiraX = JSON.parse(JSON.stringify(ONBOARDING_USERS));
            const UserJiraUIDSO = UserJiraX.jiraOver50UIDS.filter(p => !UserJiraX.jiraOver1000UIDS?.includes(p)) || [];
            // const UserJiraUIDS = [UserJiraUIDSX[0]];
            // const UserJiraUIDS = ["641992310e6828ab2025df10"];
            // const UserJiraUIDS = ["5fd72f3991bb2e0108f63fa2"]; // nichal
            const hourissue = UserJiraX.hour?.issueTurtles || 0; // this will be from 0-24 based on 24h per day
            const timesCount = UserJiraX.hour?.issueTimeTurtles || 0;
            const dividedArray = await divideArray((UserJiraUIDSO || []), processPerHour);

            const UserJiraUIDS = dividedArray[hourissue] || [];
            // const UserJiraUIDS = ["641992310e6828ab2025df10"]; // dip
            // const UserJiraUIDS = ["641166db9d2bc6c90a899c38"]; // mayank
            // const UserJiraUIDS = ["62d1584bc4c3be001fb5ca87"]; // happy
            // const UserJiraUIDS = ["6406d9197655a3223a2435a7"]; // ankita
            // const UserJiraUIDS = ["5fd72f3991bb2e0108f63fa2"]; // Nihchal
            // const UserJiraUIDS = ["63aaade17cde7bff9d7861e3"]; // shivani.sharma@cloudeq.com
            // const UserJiraUIDS = ["62b17deb42d926a01e521c79"]; // test

            // const UserJiraUIDS = ["63590454b7b39379d71fa518"];
            let howLong = dividedArray?.length || 0;
            await shiftNEXTUID(hourissue, howLong, timesCount);




            if(UserJiraUIDS.length == 0){
                return ({ status: true, info:"NO UIDS FOR TURTLES" })
            }else{
                let sleepStart = 3;

                

                for (let s = 0; s < UserJiraUIDS.length; s++) {
                    // const jiraID = "641992310e6828ab2025df10"; // DipTEST
                    // const jiraID = UserJiraUIDS[1];
                    const jiraID = UserJiraUIDS[s];
                    console.log('jid: ', UserJiraUIDS[s])
                    // const jiraID = accountID; of jira

                        // call function here to update fish users
            const issueProcess = await getAllMyIssues(via, "SCARCED", jiraID, hourissue, processPerHour, dividedArray.length, "TURTLES" )

            doneViaSCARCED++
            sleepStart--;
            if(sleepStart == 0){
                sleepStart = 3;
                await sleep(1000);
            }
    
    
    if(UserJiraUIDS.length == (s+1)){ // we need to wait for serval then trigger this
        console.log('DONE TURTLES ISSUE', doneViaSCARCED, UserJiraUIDS.length)
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
            "hour.issueTurtles":(hourissue >= howLong ? 0:(hourissue+1)),
            "hour.issueTimeTurtles":(timesCount + 1),
            "hour.issueTotalTurtles":howLong
        }
    });
    return ONBOARDING_USERSUPDATE
}