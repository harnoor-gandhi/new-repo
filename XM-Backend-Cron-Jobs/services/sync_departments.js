
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
    DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_KNOW
    // ProdDB, CLOUD_INSTANCE
} = require('../backendHttpTrigger/credsStore');



let CurrentDate = new Date();
let GetWantStart = new Date(CurrentDate);
GetWantStart.setHours(0, 0, 0, 0); // Set to 00:00:00.000
GetWantStart.setDate(26); // Set to the 26th of last month
let GetWantFinish = new Date(CurrentDate);
GetWantFinish.setHours(23, 59, 59, 999); // Set to 23:59:59.999
GetWantFinish.setDate(25); // Set to the 25th of last month
let GetWantStartMonth0 = new Date(GetWantStart);
let GetWantFinishMonth0 = new Date(GetWantFinish);
let GetWantStartMonth1 = new Date(GetWantStart);
let GetWantFinishMonth1 = new Date(GetWantFinish);
let GetWantStartMonth2 = new Date(GetWantStart);
let GetWantFinishMonth2 = new Date(GetWantFinish);

let thirtyDaysAgo = new Date(CurrentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
let GetWantStartMonthX = new Date(thirtyDaysAgo);
GetWantStartMonthX.setHours(0, 0, 0, 0); // Set to 00:00:00.000
let GetWantFinishMonthX = new Date(CurrentDate);
GetWantFinishMonthX.setHours(23, 59, 59, 999); // Set to 23:59:59.999

GetWantStartMonth0.setMonth( GetWantStartMonth0.getMonth() - 1 );
GetWantFinishMonth0.setMonth( GetWantFinishMonth0.getMonth() - 0 );

GetWantStartMonth1.setMonth( GetWantStartMonth1.getMonth() - 2 );
GetWantFinishMonth1.setMonth( GetWantFinishMonth1.getMonth() - 1 );

GetWantStartMonth2.setMonth( GetWantStartMonth2.getMonth() - 3 );
GetWantFinishMonth2.setMonth( GetWantFinishMonth2.getMonth() - 2 );

const myDB = mongoose.connection.useDb(useDB_PROD);


function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

module.exports = {
    onBoardDepartments: async function(via){
        let processPerHour = 400; // stretch it based jira api ie:10/s

        // console.log({success:true, via:via})
        if(via !== 'CREATED' && via !== 'MANUALY' && via !== 'SCHEDULED'){
            return ({status:false, err: "You don't know what your doing, please consider proper training!"})
        }else{
            let timestamp = Date.now();
            const currentDate = new Date(timestamp);



                    let monthW0 = [26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,];
                    let monthW1 = [26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,];
                    let monthW2 = [26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,];
                    let thisMon0 = new Date(GetWantFinishMonth0)
                    let thisMon1 = new Date(GetWantFinishMonth1)
                    let thisMon2 = new Date(GetWantFinishMonth2)
                    monthW0 = monthW0.filter(d => !( d > getLastDayOfMonth(thisMon0.getFullYear(), (thisMon0.getMonth() + 0)) ));
                    monthW1 = monthW1.filter(d => !( d > getLastDayOfMonth(thisMon1.getFullYear(), (thisMon1.getMonth() + 0)) ));
                    monthW2 = monthW2.filter(d => !( d > getLastDayOfMonth(thisMon2.getFullYear(), (thisMon2.getMonth() + 0)) ));
                
        monthW0 =  monthW0.map(d => { 
        let mon = GetWantFinishMonth0.getMonth(); 
            return {
                date: new Date((d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()), mon, d),
                d:d, m:(d < 26 ? (mon+1): (mon == 0 ? 12:mon)), y:(d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()),
            }
        })
                

        monthW1 =  monthW1.map(d => { 
        let mon = GetWantFinishMonth1.getMonth(); 
            return {
                date: new Date((d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()), mon, d),
                d:d, m:(d < 26 ? (mon+1): (mon == 0 ? 12:mon)), y:(d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()),
            }
        })
                

        monthW2 =  monthW2.map(d => { 
        let mon = GetWantFinishMonth2.getMonth(); 
            return {
                date: new Date((d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()), mon, d),
                // ( d +'-'+ (d < 26 ? (mon+1): (mon == 0 ? 12:mon)) +'-'+ (d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()) ),
                d:d, m:(d < 26 ? (mon+1): (mon == 0 ? 12:mon)), y:(d < 26 ? GetWantFinishMonth1.getFullYear() : GetWantStartMonth2.getFullYear()),
            }
        })

        let USERLIST = await myDB.collection(DB_USERS).find({}, {limit:processPerHour, skip:0}).toArray();
  

        let knowDepartments = []


        for (let u = 0; u < USERLIST.length; u++) {
            
        let n = USERLIST[u].azureUser.department.toLowerCase().split(' ').join('_').split('&').join('and');

        
            if(USERLIST[u].projectMap?.MonthMinus0){
                monthW0.map(o => {
                    let oi = USERLIST[u].projectMap?.MonthMinus0.findIndex(s => s.date == o.d)
                    if(oi >= 0){
                        let mW = o;
                        let p = USERLIST[u].projectMap?.MonthMinus0[oi].loggedTime;
                        if(!mW[n]){
                            mW[n] = [];
                            mW[`loggedTime_${n}`] = 0;
                        }
                        mW[`loggedTime_${n}`] += p;

                        let xi = mW[n].findIndex(e => e.user == USERLIST[u].jiraUser.accountId);
                        if(p > 0){
                        if(xi == -1){
                            // console.log("OLA1", p)
                            // mW[n].push(USERLIST[u].jiraUser.accountId)
                            mW[n].push({user:USERLIST[u].jiraUser.accountId, loggedTime:USERLIST[u].projectMap.MonthMinus0[oi].loggedTime})
                            return mW;
                        }else{
                            mW[n][xi].loggedTime += USERLIST[u].projectMap.MonthMinus0[oi].loggedTime;
                            return mW
                        }
                        }else{
                            return o
                        }
                    }else{
                        return o
                    }
                })
            }


            if(USERLIST[u].projectMap?.MonthMinus1){
                monthW1.map(o => {
                    let oi = USERLIST[u].projectMap?.MonthMinus1.findIndex(s => s.date == o.d)
                    if(oi >= 0){
                        let mW = o;
                        let p = USERLIST[u].projectMap?.MonthMinus1[oi].loggedTime;
                        if(!mW[n]){
                            mW[n] = [];
                            mW[`loggedTime_${n}`] = 0;
                        }
                        mW[`loggedTime_${n}`] += p;

                        let xi = mW[n].findIndex(e => e.user == USERLIST[u].jiraUser.accountId);
                        if(p > 0){
                        if(xi == -1){
                            // console.log("OLA1", p)
                            // mW[n].push(USERLIST[u].jiraUser.accountId)
                            mW[n].push({user:USERLIST[u].jiraUser.accountId, loggedTime:USERLIST[u].projectMap.MonthMinus1[oi].loggedTime})
                            return mW;
                        }else{
                            mW[n][xi].loggedTime += USERLIST[u].projectMap?.MonthMinus1[oi].loggedTime;
                            return mW
                        }
                        }else{
                            return o
                        }
                    }else{
                        return o
                    }
                })
            }
            
            if(USERLIST[u].projectMap?.MonthMinus2){
                monthW2.map(o => {
                    let oi = USERLIST[u].projectMap?.MonthMinus2.findIndex(s => s.date == o.d)
                    if(oi >= 0){
                        let mW = o;
                        let p = USERLIST[u].projectMap?.MonthMinus2[oi].loggedTime;
                        if(!mW[n]){
                            mW[n] = [];
                            mW[`loggedTime_${n}`] = 0;
                        }
                        mW[`loggedTime_${n}`] += p;

                        let xi = mW[n].findIndex(e => e.user == USERLIST[u].jiraUser.accountId);
                        if(p > 0){
                        if( xi == -1){
                            // console.log("OLA1", p)
                            // mW[n].push(USERLIST[u].jiraUser.accountId)
                            mW[n].push({user:USERLIST[u].jiraUser.accountId, loggedTime:USERLIST[u].projectMap.MonthMinus2[oi].loggedTime})
                            return mW;
                        }else{
                            mW[n][xi].loggedTime += USERLIST[u].projectMap?.MonthMinus2[oi].loggedTime;
                            return mW
                        }
                        }else{
                            return o
                        }
                    }else{
                        return o
                    }
                })
            }
            

            console.log("DONE", USERLIST[u].email)

            if(USERLIST.length == (u+1)){
                knowDepartments.push(...monthW0)
                knowDepartments.push(...monthW1)
                knowDepartments.push(...monthW2)

                let USERSDOCSX = await myDB.collection(DB_ONBOARDING).updateOne({tag:DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_KNOW},{$set:{knowDepartments:knowDepartments}});

                return {success:true}
            }

        }
//
// store last values
//







        }

    }
}