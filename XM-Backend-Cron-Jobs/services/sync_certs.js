
const axios = require('axios');
const mongoose = require("mongoose");
const {ObjectId} = mongoose.Types;
// mongoose.set('debug', true);


const {
    CLIENT_ID, TENANT_ID, CLIENT_SECRET, GRAPH_ENDPOINT, AAD_ENDPOINT,
    useDB_PROD, 
    DB_ONBOARDING, 
    DB_ONBOARDING_DOC_USERS, DB_USERS,
    DB_ONBOARDING_DOC_BOARDS, DB_BOARDS,
    DB_ONBOARDING_DOC_PROJECTS, DB_PROJECTS,
    JIRA_DOMAIN_URL, SECURITY_TOKEN, DB_EPICS, DB_ISSUES, DB_USER_WORKLOGS, 
    DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_KNOW,
    DB_ONBOARDING_DOC_SKILLS,
    DB_ONBOARDING_DOC_CERTIFICATES
    // ProdDB, CLOUD_INSTANCE
} = require('../backendHttpTrigger/credsStore');


const myDB = mongoose.connection.useDb(useDB_PROD);


function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

module.exports = {
    onBoardCerts: async function(via){
        let processPerHour = 400; // stretch it based on timeout

        // console.log({success:true, via:via})
        if(via !== 'CREATED' && via !== 'MANUALY' && via !== 'SCHEDULED'){
            return ({status:false, err: "You don't know what your doing, please consider proper training!"})
        }else{
            let timestamp = Date.now();
            const currentDate = new Date(timestamp);


        let USERLIST = await myDB.collection(DB_USERS).find({}, {limit:processPerHour, skip:0}).toArray();
  
        let CERTSDOC = await myDB.collection(DB_ONBOARDING).findOne({tag:DB_ONBOARDING_DOC_CERTIFICATES});
  

        let newCerts = {}


        for (let u = 0; u < USERLIST.length; u++) {
            
        USERLIST[u].certify.map(v => {
            let n = v.cert.toLowerCase().trim().split(' ').join('_').split('&').join('and').split('.').join('DOT');
            if(!newCerts[`${n}`]){
                if(!CERTSDOC.certify.includes(v.cert)){
                    console.log('invalid', v.cert)
                }else{
            newCerts[`${n}`] = {
                cert: v.cert,
                resources: 0,
            }
            // newCerts[`${n}`].about = '';
                }
            }
            newCerts[`${n}`].resources++;
            return v.cert;
        })


            // console.log("DONE", USERLIST[u].email)

            if(USERLIST.length == (u+1)){

                // let USERSDOCS_CLEAN = await myDB.collection(DB_ONBOARDING).updateOne({tag:DB_ONBOARDING_DOC_CERTIFICATES},{$set:{certList:{}}});
                let USERSDOCS_UPDATE = await myDB.collection(DB_ONBOARDING).updateOne({tag:DB_ONBOARDING_DOC_CERTIFICATES},{$set:{certList:newCerts}});

                return {success:true, newCerts }
            }

        }
//
// store last values
//







        }

    }
}