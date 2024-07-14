
const axios = require('axios');
const mongoose = require("mongoose");
const {ObjectId} = mongoose.Types;
// mongoose.set('debug', true);



let CurrentDate = new Date();
if(CurrentDate.getDate() >= 26 ){
    CurrentDate.setMonth( (CurrentDate.getMonth() == 11) ? 0 : (CurrentDate.getMonth() + 1) )
}

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

const {
    isPROD,
    CLIENT_ID, TENANT_ID, CLIENT_SECRET, GRAPH_ENDPOINT, AAD_ENDPOINT,
    useDB_PROD, 
    DB_ONBOARDING, 
    DB_ONBOARDING_DOC_USERS, DB_USERS,
    DB_ONBOARDING_DOC_BOARDS, DB_BOARDS,
    DB_ONBOARDING_DOC_PROJECTS, DB_PROJECTS,
    JIRA_DOMAIN_URL, SECURITY_TOKEN, DB_EPICS, DB_ISSUES, 
    // ProdDB, CLOUD_INSTANCE
} = require('./../../backendHttpTrigger/credsStore');


async function get50IssuesApi(jiraID, startAt, maxResults){
    const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/api/2/search?jql=assignee=${jiraID}  ORDER BY UPDATED DESC &startAt=${startAt}&maxResults=${maxResults}&fields=*all`, {  
        //&filter%3Dcreated&order+by+created+DEC
        //&orderBy=created | &order+by+updated+DEC
        ///search?jql=assignee=641992310e6828ab2025df10 & startAt=${startAt}&maxResults=${maxResults}&orderBy=-key
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
        }
    });
    return response.data;
}

    const myDB = mongoose.connection.useDb(useDB_PROD);

async function getAllMyIssues(via, type, jiraID, when, ask,  dividedArrayLength, division){
    console.log("WHEN", when, type)
    let maxStop = 100;
    // jiraOver50CollectUIDS = true;
    // let collectionDone = false;


    let startAt = 0;
    let maxResults = 50;
    let total = 1;
    let $issues = [];
    // let $issuesAll = [];
    // let pro = [];
    // let sleepStart = 3;

    let extraLoopCondition = false
    while ( total > 0 && !extraLoopCondition ) {
        if( total <= 0 ){
            extraLoopCondition = true;
            console.log("WHILE JIRA FETCH IS OVER")
            break;
        }else{
                try{
                    let data = await get50IssuesApi(jiraID, startAt, maxResults)
                
                    if(startAt == 0){  
                        total = data.total; 




                        if(total == 0){
                            console.log("NO JIRA USER ISSUES")
                        }else{
                            console.log("STARTING ISSUES: ", total, dividedArrayLength)                            
                        }
                        if(type == "SEVERAL" && total >= 50 ){
                            const ONBOARDING_USERS = await myDB.collection(DB_ONBOARDING).findOne({tag: DB_ONBOARDING_DOC_USERS });
                            const UserJiraX = JSON.parse(JSON.stringify(ONBOARDING_USERS)).jiraOver50UIDS || [];
                            if(!UserJiraX.includes(jiraID)){
                            let timestamp = Date.now();
                            const currentDate = new Date(timestamp);
                            const updateUser = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_USERS}, { 
                                $push: {  
                                    jiraOver50UIDS: jiraID, 
                                    // jiraFails: !responseJIRA.data[0] ? userNowMS : undefined 
                                },
                                $set:{
                                updated:{
                                "via": via + "_" + type + "_ISSUE",
                                "now": timestamp,
                                "wow": currentDate
                                }}
                            })

                            // maintain a list of such wale users
                            }
                        }
                        if(type == "SCARCED" && total >= 1000 ){
                            const ONBOARDING_USERS = await myDB.collection(DB_ONBOARDING).findOne({tag: DB_ONBOARDING_DOC_USERS });
                            const UserJiraX = JSON.parse(JSON.stringify(ONBOARDING_USERS)).jiraOver1000UIDS || [];
                            if(!UserJiraX.includes(jiraID)){
                            let timestamp = Date.now();
                            const currentDate = new Date(timestamp);
                            const updateUser = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_USERS}, { 
                                $push: {  
                                    jiraOver1000UIDS: jiraID, 
                                    // jiraFails: !responseJIRA.data[0] ? userNowMS : undefined 
                                },
                                $set:{
                                updated:{
                                "via": via + "_" + type,
                                "now": timestamp,
                                "wow": currentDate
                                }}
                            })

                            // maintain a list of such wale users
                            }
                        }
                    }



                            total = total - (total < data.issues.length ? total : data.issues.length);
                            startAt += maxResults;
                            // console.log('SORA', data.issues.filter(z => z.key == 'XP-882').map(isu => isu.fields.issuetype))

                        $issues.push(...data.issues.map(isu => {
                            // console.log("boardId", isu.key, isu.fields.customfield_10020[0]?.boardId)
                            let u = {
                                id: isu.id, key: isu.key, 
                                projectID: isu.fields.project?.id || null, 
                                projectName: isu.fields.project?.name || null,
                                projectKey: isu.fields.project?.key || null,
                                projectCategory: isu.fields.project?.projectCategory?.name || null,
                                // summary: isu.fields.summary,
                                statusChange: ((isu.fields?.statuscategorychangedate) ? (new Date(isu.fields.statuscategorychangedate)) : null ),
                                status: isu.fields.status?.name || null,
                                priority: isu.fields.priority?.name || null,
                                issuetype: isu.fields.issuetype?.name || null,
                                summary: isu.fields.summary || "",
                                reporter:{
                                    accountId: isu.fields.reporter?.accountId || "",
                                    displayName: isu.fields.reporter?.displayName || "",
                                },

                                // aggregatetimeestimate:isu.fields.aggregatetimeestimate || 0,
                                timeestimate:isu.fields.timeoriginalestimate || 0,
                                // timeestimate:isu.fields.timeestimate || 0,
                                timespent:isu.fields.timespent || 0,

                                updated: new Date(isu.fields.updated),
                                created: new Date(isu.fields.created),
                                resolved: (isu.fields.resolutiondate ? new Date(isu.fields.resolutiondate) : null ),
                            }
                            if(isu.fields.customfield_10020 ){
                                u["boardId"] = isu.fields.customfield_10020[0].boardId; // only for scrum
                            }
                            // if(isu.key == 'XP-493'){
                            // console.log("resolved", isu.key, isu.fields.timeestimate)
                            // }

                                return u


                        }))
                        
                        if($issues.length == data.total || $issues.length == maxStop){
                        extraLoopCondition = true;
                            // $issues = [...new Map($issues.map(item => [item.key, item])).values()];
                            console.log('Max Stop', maxStop, "total", data.total, )
                            // console.log('Max Stop', maxStop, $issues[0], )
                            // $issuesAll = $issuesAll; //$issues.map(k => k.id);
                            // console.log('Max Stop', maxStop, $issuesAll )
                            break;
                        }
                        console.log("ISSUES", total, data.issues.length, $issues.length) // jira provides duplicate inacurate data

                        // sleepStart--;
                        // if(sleepStart == 0){
                        //     sleepStart = 3;
                        //     await sleep(1000);
                        // }
                }catch(err){

            let nowTrying = {
                via, type, jiraID, when, ask, 
                total, issuesLength:$issues.length,
                file:"process_issues", line:148,
                err:JSON.stringify(err)
            };
            
            // console.log('err', err)
            const ONBOARDING_USERSUPDATE = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_USERS }, {
                $push: {"hour.errorProcessIssues":nowTrying }
            });

                    console.log("WHILE ISSUE AXIOS FAILED" , err )
                    break; // Exit the loop on error
                }
        }
    }

    console.log("finalaaa", $issues.length, $issues.map(iop => iop.key))

    $issues = $issues.filter(m => m.updated > GetWantStartMonth2 && m.updated <= GetWantFinishMonth0 )

    console.log("finalyyyy", $issues.length, $issues.map(iop => iop.key))
        
    $issues = $issues.filter( (mX, iX, sX) => iX === sX.findIndex(m => m.id === mX.id) ); // make it unique

    console.log("finalxxxx", $issues.length)

    // const createMyIssue = await myDB.collection(DB_ISSUES).insertOne({jiraID: jiraID, issues:$issues });
    const updateMyIssue = await myDB.collection(DB_ISSUES).updateOne({jiraID: jiraID}, { 
        $set:{ issues:$issues } 
    })

        let iM1 = $issues.filter(m => (m.updated > GetWantStartMonth0 && !m.resolved || m.resolved > GetWantStartMonth0 && m.resolved) && (m.created <= GetWantFinishMonth0) )
        let iM2 = $issues.filter(m => (m.updated > GetWantStartMonth1 && !m.resolved || m.resolved > GetWantStartMonth1 && m.resolved) && (m.created <= GetWantFinishMonth1) )
        let iM3 = $issues.filter(m => (m.updated > GetWantStartMonth2 && !m.resolved || m.resolved > GetWantStartMonth2 && m.resolved) && (m.created <= GetWantFinishMonth2) )

    let projectIDZ = {
        MonthMinus0: [...new Set(iM1.map(m => m.projectID))],
        MonthMinus1: [...new Set(iM2.map(m => m.projectID))],
        MonthMinus2: [...new Set(iM3.map(m => m.projectID))],

        // MonthMinusX30: [...new Set($issues.filter(m => m.updated >= GetWantStartMonthX && m.created <= GetWantFinishMonthX ).map(m => m.projectID))],
    }
    let issueIDZ = {
        timeEstimate1: iM1.filter(m => m.timeestimate ).map(m => m.timeestimate).reduce((f, s) => f + s, 0), 
        timeEstimate2: iM2.filter(m => m.timeestimate ).map(m => m.timeestimate).reduce((f, s) => f + s, 0), 
        timeEstimate3: iM3.filter(m => m.timeestimate ).map(m => m.timeestimate).reduce((f, s) => f + s, 0),
        // timeEstimateX30: [...new Set($issues.filter(m => m.updated >= GetWantStartMonthX && m.created <= GetWantFinishMonthX && m.timeestimate ).map(m => m.timeestimate))].reduce((f, s) => f + s, 0),

        MonthMinus0: [...new Set(iM1.map(m => m.key))],
        MonthMinus1: [...new Set(iM2.map(m => m.key))],
        MonthMinus2: [...new Set(iM3.map(m => m.key))],

        // MonthMinusX30: [...new Set($issues.filter(m => m.updated >= GetWantStartMonthX && m.created <= GetWantFinishMonthX ).map(m => m.key))],
    }

    let projectTree = {
        MonthMinus0: Object.values(iM1.reduce((acc, cur) => {
            if (!acc[cur.projectID]) { 
                acc[cur.projectID] = { project: cur.projectID, projectname:cur.projectName, key:cur.projectKey, timeestimate:cur.timeestimate, issue: [] }; 
            }
            acc[cur.projectID].issue.push({
                    key:cur.key,
                    est:cur.timeestimate,
                });
            acc[cur.projectID].timeestimate += (cur.timeestimate || 0);
            return acc; }, {})),
        MonthMinus1: Object.values(iM2.reduce((acc, cur) => {
            if (!acc[cur.projectID]) { acc[cur.projectID] = { project: cur.projectID, projectname:cur.projectName, key:cur.projectKey, timeestimate:cur.timeestimate, issue: [] }; }
            acc[cur.projectID].issue.push({
                key:cur.key,
                est:cur.timeestimate,
            });
            acc[cur.projectID].timeestimate += (cur.timeestimate || 0);
            return acc; }, {})),
        MonthMinus2: Object.values(iM3.reduce((acc, cur) => {
            if (!acc[cur.projectID]) { acc[cur.projectID] = { project: cur.projectID, projectname:cur.projectName, key:cur.projectKey, timeestimate:cur.timeestimate, issue: [] }; }
            acc[cur.projectID].issue.push({
                key:cur.key,
                est:cur.timeestimate,
            });
            acc[cur.projectID].timeestimate += (cur.timeestimate || 0);
            return acc; }, {})),
    }
    const updateMyUser = await myDB.collection(DB_USERS).updateOne({"jiraUser.accountId": jiraID}, { 
        $set:{ 
            testbed:-58, 
            testDivide:dividedArrayLength, 
            testType:division, 
            testMethod:(isPROD||"OFFLINE"),

            updateScheduled:(when >= 0 ? when : null),

            projectIDZ:{
                MonthMinus0: projectIDZ.MonthMinus0,
                MonthMinus1: projectIDZ.MonthMinus1,
                MonthMinus2: projectIDZ.MonthMinus2, 
            },

            "issueIDZ.timeEstimate1": issueIDZ.timeEstimate1, 
            "issueIDZ.timeEstimate2": issueIDZ.timeEstimate2, 
            "issueIDZ.timeEstimate3": issueIDZ.timeEstimate3, 
            "issueIDZ.timeEstimateX30": null,//issueIDZ.timeEstimateX30, 

            "issueIDZ.MonthMinus0":issueIDZ.MonthMinus0, 
            "issueIDZ.MonthMinus1":issueIDZ.MonthMinus1, 
            "issueIDZ.MonthMinus2":issueIDZ.MonthMinus2, 
            "issueIDZ.MonthMinusX30": null,//issueIDZ.MonthMinusX30, 

            // "projectTree.worklogs":[],
            "projectTree.MonthMinus0":projectTree.MonthMinus0,
            "projectTree.MonthMinus1":projectTree.MonthMinus1,
            "projectTree.MonthMinus2":projectTree.MonthMinus2,
        } 
    })


        
    return ({ status: true, //pro
    // issues:$issues, 
    // issuesAll:$issuesAll, 
    // projectIDZ, 
    // issueIDZ,
    // projectTree
    })
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



module.exports = {getAllMyIssues}