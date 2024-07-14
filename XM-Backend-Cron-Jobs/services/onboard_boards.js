
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
    JIRA_DOMAIN_URL, SECURITY_TOKEN, DB_EPICS, DB_ISSUES, 
    // ProdDB, CLOUD_INSTANCE
} = require('./../backendHttpTrigger/credsStore');




async function get50BoardsApi(startAt, maxResults){

    const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/agile/1.0/board?startAt=${startAt}&maxResults=${maxResults}&orderBy=+name&fields=*all`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
        }
    });
    return response.data;
}

module.exports = {
    onboardJiraBoards: async function(via){
        console.log({success:true, via:via})
        if(via !== 'CREATED' && via !== 'MANUALY' && via !== 'SCHEDULED'){
            return ({status:false, err: "You don't know what your doing, please consider proper training!"})
        }else{
            const myDB = mongoose.connection.useDb(useDB_PROD);
            const timestamp = new Date();

            let startAt = 0;
            let maxResults = 50;
            let total = 1;
            let boards = [];
        
        // pull current board document
            const ONBOARDING_BOARDS = await myDB.collection(DB_ONBOARDING).findOne({tag: DB_ONBOARDING_DOC_BOARDS });
            const OldMS_BoardList = JSON.parse(JSON.stringify(ONBOARDING_BOARDS)).boards || [];
            
            let checkCount = 0;
            let addedCount = 0;
            let updatedCount = 0;
        


            while (total > boards.length) {
                let data = await get50BoardsApi(startAt, maxResults)
        
                if(startAt == 0){  
                    console.log("BOARDX", data.values[0])
                    total = data.total;
                }
                startAt += maxResults;
                boards.push(...data.values)
        
                if(total == boards.length){


                            // check board still exist in list
                            let checkAlternate = OldMS_BoardList.filter(oB => !boards.some(nB => nB.id === oB));
                            if( checkAlternate.length > 0 ){
                                // get rid of them from checklist
                                console.log('boards - get rid of them from checklist!', OldMS_BoardList.length, boards.length, checkAlternate.length)
                            }else{
                                console.log('No board changes no pullbacks')
                            }
        
                    for (let i = 0; i < boards.length; i++) {
                        const board = boards[i];
                        const currentDate = new Date(timestamp);
                        
                        
                        let newBoard = { // type = kanban, scrum, agility
                            id:'',
                            
                            boardId:board.id,
                            self:board.self || null,
                            name:board.name || null,
                            type:board.type || null,
        
                            projectId:board.location?.projectId || null,
                            displayName:board.location?.displayName || null,
                            projectName:board.location?.projectName || null,
                            projectKey:board.location?.projectKey || null,
                            projectTypeKey:board.location?.projectTypeKey || null,
                            avatarURI:board.location?.avatarURI || null,

                            sprintsList:[], sprints:[],
                            
        
        
                            updated: timestamp, created: timestamp,
                            updWOW: currentDate, creWOW: currentDate
                        }
        
        

                        // check if document exist
                        if( !OldMS_BoardList.includes(newBoard.boardId) ){
                            // create if dosent
        
                const resultDB_BOARDS = await myDB.collection(DB_BOARDS).insertOne(newBoard);
                const resultUpdateDB_BOARDS = await myDB.collection(DB_BOARDS).updateOne({_id: resultDB_BOARDS.insertedId}, { $set: { id: new ObjectId(resultDB_BOARDS.insertedId).valueOf() } })
        
        
        if(newBoard.type == 'scrum'){
            const updateBoard = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_BOARDS}, { 
                $push: { 
                    boards: newBoard.boardId ,
                    boardsSCRUM: newBoard.boardId ,
                }, 
                $set:{updated:{
                "via": via,
                "now": timestamp,
                "wow": currentDate
                }} 
            })
        }else{
            const updateBoard = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_BOARDS}, { 
                $push: { 
                    boards: newBoard.boardId
                }, 
                $set:{updated:{
                "via": via,
                "now": timestamp,
                "wow": currentDate
                }} 
            })
        }
        
                    checkCount++;
                    addedCount++;
        
                if( boards.length == (i+1) ){
                    return ({status:true, checkCount, addedCount, updatedCount })
                }
        
                        }else{




                            // update here if needed
                const resultUpdateDB_BOARDS = await myDB.collection(DB_BOARDS).updateOne({boardId: newBoard.boardId}, { $set: {
                    // boardId:board.id,
                    self:newBoard.self,
                    name:newBoard.name,
                    type:newBoard.type,
        
                    projectId:newBoard.projectId,
                    displayName:newBoard.displayName,
                    projectName:newBoard.projectName,
                    projectKey:newBoard.projectKey,
                    projectTypeKey:newBoard.projectTypeKey,
                    avatarURI:newBoard.avatarURI,
        
                    updated: timestamp, updWOW: currentDate
                } })
        
                // if(newBoard.type == 'scrum'){
                //     const updateBoard = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_BOARDS}, { 
                //         $push: { 
                //             boards: newBoard.boardId ,
                //             boardsSCRUM: newBoard.boardId ,
                //         }, 
                //         $set:{updated:{
                //         "via": via,
                //         "now": timestamp,
                //         "wow": currentDate
                //         }} 
                //     })
                // }

                checkCount++;
                updatedCount++;
        
                if( boards.length == (i+1) ){
                    return ({status:true, checkCount, addedCount, updatedCount  })
                }
        
                        }
        
                
                    
                    }
        
                }
            }
        
        
        
            
        }
    }
}
