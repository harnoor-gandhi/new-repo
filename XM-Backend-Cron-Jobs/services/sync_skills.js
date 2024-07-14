
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
    DB_ONBOARDING_DOC_SKILLS
    // ProdDB, CLOUD_INSTANCE
} = require('../backendHttpTrigger/credsStore');

const myDB = mongoose.connection.useDb(useDB_PROD);


function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

module.exports = {
    onBoardSkills: async function(via){
        let processPerHour = 400; // stretch it based on timeout

        // console.log({success:true, via:via})
        if(via !== 'CREATED' && via !== 'MANUALY' && via !== 'SCHEDULED'){
            return ({status:false, err: "You don't know what your doing, please consider proper training!"})
        }else{
            let timestamp = Date.now();
            const currentDate = new Date(timestamp);


        let USERLIST = await myDB.collection(DB_USERS).find({}, {limit:processPerHour, skip:0}).toArray();
  
        let SKILLSDOC = await myDB.collection(DB_ONBOARDING).findOne({tag:DB_ONBOARDING_DOC_SKILLS});
  

        let newSkills = {}


        for (let u = 0; u < USERLIST.length; u++) {
        USERLIST[u].skills.map(v => {
            let n = v.skill.toLowerCase().trim().split(' ').join('_').split('&').join('and').split('.').join('DOT');
            if(!newSkills[`${n}.skill`]){
                if(!SKILLSDOC.skills.includes(v.skill)){
                    console.log('invalid:', v.skill, USERLIST[u].email)
            // newSkills[`${n}.about`] = '';
                }else{
                    // newSkills[`${n}`] = {
                    //     skill: v.skill,
                    //     resources: 0,
                    //     advanced: 0,
                    //     intermediate: 0,
                    //     beginner: 0,
                    // }
                    newSkills[`skillList.${n}.skill`] = v.skill;
                    newSkills[`skillList.${n}.resources`] = 0;
                    newSkills[`skillList.${n}.advanced`] = 0;
                    newSkills[`skillList.${n}.intermediate`] = 0;
                    newSkills[`skillList.${n}.beginner`] = 0;
                }
            }
            newSkills[`skillList.${n}.resources`]++;
            if(v.userLevel == 'advanced'){newSkills[`skillList.${n}.advanced`]++;}
            if(v.userLevel == 'intermediate'){newSkills[`skillList.${n}.intermediate`]++;}
            if(v.userLevel == 'beginner'){newSkills[`skillList.${n}.beginner`]++;}
            return v.skill;
        })


            // console.log("DONE", USERLIST[u].email)

            if(USERLIST.length == (u+1)){

                let USERSDOCSX = await myDB.collection(DB_ONBOARDING).updateOne({tag:DB_ONBOARDING_DOC_SKILLS},{$set:{...newSkills}});

                return {success:true, newSkills }
            }

        }
//
// store last values
//







        }

    }
}