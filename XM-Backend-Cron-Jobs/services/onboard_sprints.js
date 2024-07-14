const axios = require("axios");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// mongoose.set('debug', true);

// only scrum type boards have sprint

const {
  CLIENT_ID,
  TENANT_ID,
  CLIENT_SECRET,
  GRAPH_ENDPOINT,
  AAD_ENDPOINT,
  useDB_PROD,
  DB_ONBOARDING,
  DB_ONBOARDING_DOC_USERS,
  DB_USERS,
  DB_ONBOARDING_DOC_BOARDS,
  DB_BOARDS,
  DB_ONBOARDING_DOC_PROJECTS,
  DB_PROJECTS,
  JIRA_DOMAIN_URL,
  SECURITY_TOKEN,
  DB_EPICS,
  DB_ISSUES,
  // ProdDB, CLOUD_INSTANCE
} = require("./../backendHttpTrigger/credsStore");

async function get50SprintsApi(boardID, startAt, maxResults) {
  const response = await axios.get(
    `https://${JIRA_DOMAIN_URL}rest/agile/1.0/board/${boardID}/sprint?startAt=${startAt}&maxResults=${maxResults}`,
    {
      //&orderBy=+name
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString(
          "base64"
        )}`,
      },
    }
  );
  return response.data;
}

module.exports = {
  onboardJiraSprints: async function (via) {
    console.log({ success: true, via: via });
    if (via !== "CREATED" && via !== "MANUALY" && via !== "SCHEDULED") {
      return {
        status: false,
        err: "You don't know what your doing, please consider proper training!",
      };
    } else {
      const myDB = mongoose.connection.useDb(useDB_PROD);

      // pull current board document
      const ONBOARDING_BOARDS = await myDB
        .collection(DB_ONBOARDING)
        .findOne({ tag: DB_ONBOARDING_DOC_BOARDS });
      const OldMS_BoardList =
        JSON.parse(JSON.stringify(ONBOARDING_BOARDS)).boardsSCRUM || [];
      // const OldMS_BoardList = [64];

      let timestamp = Date.now();
      const currentDate = new Date(timestamp);

      for (let b = 0; b < OldMS_BoardList.length; b++) {
        const boardID = OldMS_BoardList[b];

        let startAt = 0;
        let maxResults = 100;
        let total = 1;
        let sprints = [];

        while (total > sprints.length) {
          try {
            let data = await get50SprintsApi(boardID, startAt, maxResults);
            console.log("HIT", data.total);

            if (startAt == 0) {
              total = data.total;
            }
            startAt += maxResults;
            sprints.push(...data.values);

            // if(!data){
            //     return {i:'issue here'}
            // }else{
            //     return 'all ok'
            // }

            if (total == sprints.length) {
              // check board still exist in list
              let checkAlternate = OldMS_BoardList.filter(
                (oB) => !sprints.some((nS) => nS.id === oB)
              );
              if (checkAlternate.length > 0) {
                // get rid of them from checklist
                console.log(
                  "boards - get rid of them from checklist!",
                  OldMS_BoardList.length,
                  sprints.length,
                  checkAlternate.length
                );
              } else {
                console.log("No board changes no pullbacks");
              }

              const sprintsList = sprints.map((sp) => sp.id);

              const resultUpdateDB_BOARDS = await myDB
                .collection(DB_BOARDS)
                .updateOne(
                  { boardId: boardID },
                  {
                    $set: {
                      sprintsList: sprintsList,
                      sprints: sprints,

                      updated: timestamp,
                      updWOW: currentDate,
                    },
                  }
                );

              // add all sprint ids to board
              // add sprints to board document

              // for (let i = 0; i < OldMS_BoardList.length; i++) {
              //     const boardID = OldMS_BoardList[i];
              //     let timestamp = Date.now();
              //     const currentDate = new Date(timestamp);

              // }

              if (OldMS_BoardList.length == b + 1) {
                console.log("DONE");
                return { status: true };
              }
            }
          } catch (err) {
            console.log("failed to get for ", boardID);
          }
          /*            
                // if(sprints.length == 0){
                //     if( OldMS_BoardList.length == (b+1) ){
                //         return ({status:true })
                //     }
                // }

*/
        }
      }
    }
  },
};
