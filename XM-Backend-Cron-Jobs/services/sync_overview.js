
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
    DB_PROJECTOVERVIEW
    // ProdDB, CLOUD_INSTANCE
} = require('../backendHttpTrigger/credsStore');

const myDB = mongoose.connection.useDb(useDB_PROD);

async function getProjectUsersApi(projectId){
    // const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/agile/1.0/board/${boardId}/epic?startAt=${startAt}&maxResults=${maxResults}`, { 
    //     headers: {
    //         'Accept': 'application/json',
    //         'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
    //     }
    // });
    // https://cloudeq.atlassian.net/rest/api/3/user/assignable/search?project=XP
    // const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/api/3/project/${projectId}/role/10023`, {

    const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/api/3/user/assignable/search?project=${projectId}`, {
      headers: {
        // 'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from( `${SECURITY_TOKEN}` ).toString('base64')}`,
        // 'Content-Type': 'application/json'
      }
    });

    return response.data;
}
async function getBoardEpicsApi(boardId, startAt, maxResults){
    const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/agile/1.0/board/${boardId}/epic?startAt=${startAt}&maxResults=${maxResults}`, { 
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
        }
    });

    return response.data;
}

async function getBoardEpicIssuesApi(boardId, epicID, startAt, maxResults){
    const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/agile/1.0/board/${boardId}/epic/${epicID}/issue?startAt=${startAt}&maxResults=${maxResults}&fields=issuetype,status,timespent,timeoriginalestimate,assignee,created,updated,resolved,summary`, { 
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
        }
    });

    return response.data;
}

async function getSprintIssuesApi(sprintId, startAt, maxResults){
    const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=${maxResults}&fields=issuetype,status,closedSprints,sprint,epic,timespent,timeoriginalestimate,assignee,summary`, { 
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
        }
    });

    return response.data;
}

function divideArray(array, size) {
    const dividedArray = [];
    for (let i = 0; i < array.length; i += size) {
      dividedArray.push(array.slice(i, i + size));
    }
    return dividedArray;
}

async function shiftNEXTPROJECT(hourissue, howLong){
    const ONBOARDING_USERSUPDATE = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_PROJECTS }, {
        $set: {
            "hour.projects":(hourissue > howLong ? 0:(hourissue+1)),
            "hour.Totalprojects":howLong
        }
    });
    return ONBOARDING_USERSUPDATE
}

function getWorkingDays(startDate, endDate) {
    // console.log(startDate, endDate, )
  
    const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    let workingDays = 0;
    let currentDate = new Date(startDate.getTime());
    // let endDate = new Date(endDateX.getTime());
    // currentDate.setHours(0,0,0,0)
  
    while (currentDate.getTime() <= endDate.getTime()) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
        currentDate.setTime(currentDate.getTime() + oneDay); // Move to the next day
    }
  
    return workingDays; //1713551400000
  }

module.exports = {
    onBoardOverview: async function(via){
        if(via !== 'CREATED' && via !== 'MANUALY' && via !== 'SCHEDULED'){
            return ({status:false, err: "You don't know what your doing, please consider proper training!"})
        }else{
            let processPerHour = 1; 

            
            const ONBOARDING_PROJECTS = await myDB.collection(DB_ONBOARDING).findOne({tag: DB_ONBOARDING_DOC_PROJECTS });
            const hourproject = ONBOARDING_PROJECTS.hour?.projects || 0; // this will be from 0-24 based on 24h per day
            const dividedArray = await divideArray((ONBOARDING_PROJECTS.projects || []), processPerHour);
            // const allProjects = dividedArray[hourproject] || [];
            // let allProjects = [10120]; // xm scrum
            // let allProjects = [10095]; // qrs scrum
            // let allProjects = [10065]; // crd scrum
            // let allProjects = [10073]; // finops scrum
            // let allProjects = [10090]; // xm kanban
            // let allProjects = [10041]; // mix extra data tochure time
            // let allProjects = [10057]; // mix
            // let allProjects = [10033]; // logic
            let allProjects = [10079]; // logic
            // let allProjects = [allProjects[0]]; // first one


            let howLong = dividedArray?.length || 0;
            await shiftNEXTPROJECT(hourproject, howLong);
            

            if(allProjects.length == 0){

                return {success:true, info:"no more projects" }

            }else{
            console.log('starting', allProjects)
                

        let doneProjects = [];

        for (let h = 0; h < allProjects.length; h++) {
            let projectId = (+allProjects[h]);

        let PROJECTX = await myDB.collection(DB_BOARDS).find({projectId:projectId}, {projection:{boardId:1, sprints:1, name:1, type:1}}).toArray();

   
        // PROJECTX = [PROJECTX[0]]

        if(PROJECTX.length == 0){
            console.log("No Boards for Project", projectId, PROJECTX)

            doneProjects.push({projectId, success:false, info:"No Boards for Project" })

        }else{

    try{
        let projectBoards = [];

        let projectActors = await getProjectUsersApi(projectId)
        projectActors = projectActors.map(a => {return {id: a?.accountId || '', name:a?.displayName || '' }});

        for (let p = 0; p < PROJECTX.length; p++) {
            let boardId = PROJECTX[p].boardId;
            console.log('projectId', projectId, 'boardId',boardId)
            const boardEpics = await getBoardEpicsApi(boardId, 0, 50)

            let boardEpicList = []
            // let allSprintIssues = []
            

                for (let e = 0; e < boardEpics.values.length; e++) {
                    // const element = boardEpics.values[e];
                    
                    const boardEpicIssues = await manageEpicIssues(boardId, boardEpics.values[e].id, PROJECTX[p].type)

                    boardEpicList.push(
                        // boardEpicIssues.total
                        {
                            epicID:boardEpics.values[e].id, 
                            epicKey:boardEpics.values[e].key, 
                            epicName:boardEpics.values[e].name, 
                            summary:boardEpics.values[e].summary, 
                            issues:boardEpicIssues
                        }

                    )

                    if(boardEpics.values.length == (e+1)){

                if(PROJECTX[p].type == 'kanban'){
                    console.log('altr', PROJECTX[p].type)
                    projectBoards.push({
                        boardId, 
                        name:PROJECTX[p].name,
                        type:PROJECTX[p].type || '',
                        epics: boardEpicList
                    })

                }
                
                if(PROJECTX[p].type == 'scrum'){
                    PROJECTX[p].sprints = PROJECTX[p].sprints.filter(iop => iop.state == 'closed' || iop.state == 'active');

                        let sprintsInfo = []

                        for (let s = 0; s < PROJECTX[p].sprints.length; s++) {
                            // let element = PROJECTX[p].sprints[s];
                            
                            console.log(PROJECTX[p].sprints.length, "/", s, "sprint start", PROJECTX[p].sprints[s].id)
                            let workingDays = getWorkingDays(new Date(PROJECTX[p].sprints[s].startDate), new Date(PROJECTX[p].sprints[s].endDate));

                            const sprintIssues = await manageSprintIssues(PROJECTX[p].sprints[s].id, workingDays )
                            
                            // allSprintIssues.push(...sprintIssues)

                            sprintsInfo.push(
                                // PROJECTX[p].sprints.map(s => {return 
                                    {
                                    sprintId:PROJECTX[p].sprints[s].id, 
                                    name:PROJECTX[p].sprints[s].name, 
                                    issueCount:sprintIssues.length,
                                    workingDays: workingDays,
                                    issues:sprintIssues
                                }
                            // })
                            )

                            if((PROJECTX[p].sprints.length == s+1)){
                            projectBoards.push({
                                boardId,
                                name:PROJECTX[p].name, 
                                type:PROJECTX[p].type ||'',
                                epics: boardEpicList,

                                // epics: boardEpicList.map(q => {
                                //     return {
                                //         ...q,
                                //         issues: sprintIssues.filter(r => r.epic == q.epicID)
                                //     }
                                // }),
                                sprints: sprintsInfo, //sprintIssues
                            })
                            }
                        }
                }


                    }
                }


            if(PROJECTX.length == (p+1)){
                let sendMe = {
                    // projectId: projectId, 
                    actors:projectActors, 
                    boards:projectBoards,
                    testkid:true
                }

            const resultCreateDB_OVERVIEW = await myDB.collection(DB_PROJECTOVERVIEW).updateOne( {projectId: (projectId + "")}, { $set:sendMe })

            doneProjects.push({projectId, success:true})
            // return {success:true, data:sendMe}
            }
        }

    }catch(err){
        console.log("ERR", projectId, err)
        doneProjects.push({projectId, success:false})    
    }


        }

            if(allProjects.length == (h+1)){
                return {success:true, data:doneProjects}
            } 


        }

            }

        }

    }
}

async function manageSprintIssues(sprintId, workingDays){
    let total = 1
    let startAt = 0;
    let limit = 50;
    let issues = []

    while (total > 0) {

        const sprintIssues = await getSprintIssuesApi(sprintId, startAt, limit)
        if(startAt == 0){
            total = sprintIssues.total
            // console.log('sprinti', sprintIssues.issues.map(n => n.id))
        }
        total = total - sprintIssues.issues.length;
        startAt += 50;
        console.log("process", sprintIssues.total, total, sprintIssues.issues.length)


        issues.push(...sprintIssues.issues
            .map(si => {
            // console.log(si) 
            return {
            id: si.id,
            key: si.key,
            avatarUrls: (si.fields.assignee?.avatarUrls['24x24']||""),
            displayName: (si.fields.assignee?.displayName||""),
            accountId: (si.fields.assignee?.accountId||""),
            summary: si.fields.summary,
            issuetype: si.fields.issuetype.name,
            status: si.fields.status.name,
            closed: si.fields.closedSprints?.map(y => y.id) || [],
            sprint: si.fields.sprint?.id||null,
            epic: si.fields.epic?.id||null,
            timespent: si.fields.timespent||0,
            timeestimate: si.fields.timeoriginalestimate||0,
            planned: (si.fields.timeoriginalestimate/workingDays) ||0,
            // days: workingDays,
            }})
        )

        if(total == 0){
            break;
        }
    }

    return issues;
}


async function manageEpicIssues(boardId, epicID, boardType){
    let total = 1
    let startAt = 0;
    let limit = 50;
    let issues = []

    while (total > 0) {

        const sprintIssues = await getBoardEpicIssuesApi(boardId, epicID, startAt, limit)
        if(startAt == 0){
            total = sprintIssues.total
            console.log("process", sprintIssues.total, )
        }
        total = total - sprintIssues.issues.length;
        startAt += 50;
        // console.log("process", sprintIssues.total, total, sprintIssues.issues.length)

        issues.push(...sprintIssues.issues
            .map(si => { 

                let iop = {
            id: si.id,
            key: si.key,
            issuetype: si.fields.issuetype.name,
            status: si.fields.status.name
                }

            if(boardType == 'kanban'){
                iop.avatarUrls = (si.fields.assignee?.avatarUrls['24x24']||"")
                iop.displayName = (si.fields.assignee?.displayName||"")
                iop.accountId = (si.fields.assignee?.accountId||"")
                iop.timespent = si.fields.timespent||0
                iop.timeestimate = si.fields.timeoriginalestimate||0
                iop.created = si.fields.created
                iop.updated = si.fields.updated
                iop.resolved = si.fields.resolved
                iop.summary = si.fields.summary
            }

            return iop
        })
        )

        if(total == 0){
            break;
        }
    }

    return issues;
}