const axios = require("axios");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// mongoose.set('debug', true);

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
  DB_USER_WORKLOGS,
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW,
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_ACTIVE,
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE,
  // ProdDB, CLOUD_INSTANCE
} = require("./../backendHttpTrigger/credsStore");

const {
  getProcessedWorklogsApi,
  getProcessedTeamsApi,
} = require("./reusable-functions/process_worklogs");

let CurrentDate = new Date();
if (CurrentDate.getDate() >= 26) {
  CurrentDate.setMonth(
    CurrentDate.getMonth() == 11 ? 0 : CurrentDate.getMonth() + 1
  );
} else {
  if (CurrentDate.getDate() == 1) {
    CurrentDate.setMonth(
      CurrentDate.getMonth() == 0 ? 11 : CurrentDate.getMonth() - 1
    );
  } else {
    // this will work automaticly....
  }
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

let thirtyDaysAgo = new Date(CurrentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
let GetWantStartMonthX = new Date(thirtyDaysAgo);
GetWantStartMonthX.setHours(0, 0, 0, 0); // Set to 00:00:00.000
let GetWantFinishMonthX = new Date(CurrentDate);
GetWantFinishMonthX.setHours(23, 59, 59, 999); // Set to 23:59:59.999

GetWantStartMonth0.setMonth(GetWantStartMonth0.getMonth() - 3);
GetWantFinishMonth0.setMonth(GetWantFinishMonth0.getMonth() - 2);

GetWantStartMonth1.setMonth(GetWantStartMonth1.getMonth() - 2);
GetWantFinishMonth1.setMonth(GetWantFinishMonth1.getMonth() - 1);

GetWantStartMonth2.setMonth(GetWantStartMonth2.getMonth() - 1);
GetWantFinishMonth2.setMonth(GetWantFinishMonth2.getMonth() - 0);

const myDB = mongoose.connection.useDb(useDB_PROD);

module.exports = {
  onboardJiraWorklogs: async function (via) {
    console.log({ success: true, via: via });
    if (via !== "CREATED" && via !== "MANUALY" && via !== "SCHEDULED") {
      return {
        status: false,
        err: "You don't know what your doing, please consider proper training!",
      };
    } else {
      let processPerHour = 8; // stretch it based jira api ie:10/s
      // let sleepStart = 1;

      const ONBOARDING_USERS = await myDB
        .collection(DB_ONBOARDING)
        .findOne({ tag: DB_ONBOARDING_DOC_USERS });
      const UserJiraX = JSON.parse(JSON.stringify(ONBOARDING_USERS)) || [];
      const UserJiraUIDSO = UserJiraX.jiraUIDS;
      const hourworklog = UserJiraX.hour?.worklogs || 0; // this will be from 0-24 based on 24h per day
      const timesCount = UserJiraX.hour?.worklogTime || 0;
      const dividedArray = await divideArray(
        UserJiraUIDSO || [],
        processPerHour
      );
      const UserJiraUIDS = dividedArray[hourworklog] || [];
      // const UserJiraUIDS = ["5fd72f3991bb2e0108f63fa2"]; // nichal
      // const UserJiraUIDS = ["62d1584bc4c3be001fb5ca87"]; // happy
      // const UserJiraUIDS = ["712020:ef8a18ac-736f-4ae9-a938-365cffdfb355"]; // ravinder
      // const UserJiraUIDS = ["641992310e6828ab2025df10"]; // dip
      // const UserJiraUIDS = ["639ac77176fb74a95142b24e"]; // sanyam
      // const UserJiraUIDS = ["641166db9d2bc6c90a899c38"]; // mayank
      // const UserJiraUIDS = ["63aaade17cde7bff9d7861e3"]; // shivani.sharma@cloudeq.com
      // const UserJiraUIDS = [
      //     "62d1584bc4c3be001fb5ca87",
      //     "641992310e6828ab2025df10"
      // ]; // biman
      // const UserJiraUIDS = ["62ab6c45ddc560006e8d344e"]; // test
      // console.log(dividedArray)
      // const UserJiraUIDS = ["63590454b7b39379d71fa518"];
      let howLong = dividedArray?.length || 0;
      await shiftNEXTUID(hourworklog, howLong, timesCount);

      /*
            const hourworklog = 0; // this will be from 0-24 based on 24h per day
            let UserJiraUIDS = await myDB.collection(DB_USERS).find({testsky: {$ne:-24} }, {limit:processPerHour}).toArray();
            UserJiraUIDS = UserJiraUIDS.map(u => u.jiraUser.accountId)
*/
      let updateLogList = [];
      if (UserJiraUIDS.length == 0) {
        return { status: true, UserJiraUIDS };
      } else {
        const tknRes = await axios.post(
          `https://${AAD_ENDPOINT}${TENANT_ID}/oauth2/v2.0/token`,
          `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=https://graph.microsoft.com/.default`
        );

        for (let i = 0; i < UserJiraUIDS.length; i++) {
          const jiraID = UserJiraUIDS[i];
          console.log("jiraID", jiraID);

          // find user
          const resultDB_USERS = await myDB
            .collection(DB_USERS)
            .findOne({ "jiraUser.accountId": jiraID });
          const COMPLETEUSER = JSON.parse(JSON.stringify(resultDB_USERS));
          // console.log("COMPLETEUSER", jiraID, resultDB_USERS)

          // check issues
          let issueList = [];
          if (COMPLETEUSER?.issueIDZ?.MonthMinus0) {
            issueList.push(...COMPLETEUSER.issueIDZ.MonthMinus0);
          }
          if (COMPLETEUSER?.issueIDZ?.MonthMinus1) {
            issueList.push(...COMPLETEUSER.issueIDZ.MonthMinus1);
          }
          if (COMPLETEUSER?.issueIDZ?.MonthMinus2) {
            issueList.push(...COMPLETEUSER.issueIDZ.MonthMinus2);
          }
          issueList = [...new Set(issueList)];

          try {
            let rTe = await getProcessedTeamsApi(
              COMPLETEUSER.email,
              tknRes,
              GetWantFinishMonth0,
              GetWantStartMonth0,
              GetWantFinishMonth1,
              GetWantStartMonth1,
              GetWantFinishMonth2,
              GetWantStartMonth2
            );

            if (issueList.length == 0 || rTe.suspended) {
              const updateLog = await updateNoLogs(
                jiraID,
                false,
                COMPLETEUSER.azureUser?.department,
                // hourworklog, howLong,
                [],
                [],
                [],
                [],
                0,
                0,
                0, //0,
                rTe.responseTeams0,
                // rTe.responseTeams1, rTe.responseTeams2,
                COMPLETEUSER.projectMap?.MonthMinus0 || [],
                COMPLETEUSER.projectMap?.MonthMinus1 || [],
                COMPLETEUSER.projectMap?.MonthMinus2 || [],
                rTe.suspended ? true : false
              );

              updateLogList.push(updateLog);

              if (UserJiraUIDS.length == i + 1) {
                // const startDepartData = await setCentralData(hourworklog, updateLogList.filter(y => y.success))

                console.log("DONE WORKLOGS");
                return {
                  status: true,
                  updateLogList,
                  // startDepartData
                };
              }
            } else {
              const processor = await getProcessedWorklogsApi(
                jiraID,
                issueList,
                hourworklog
              );

              if (processor.length == 0) {
                const updateLog = await updateNoLogs(
                  jiraID,
                  false,
                  COMPLETEUSER.azureUser?.department,
                  // hourworklog, howLong,
                  [],
                  [],
                  [],
                  [],
                  0,
                  0,
                  0, //0,
                  rTe.responseTeams0,
                  // rTe.responseTeams1, rTe.responseTeams2,
                  COMPLETEUSER.projectMap?.MonthMinus0 || [],
                  COMPLETEUSER.projectMap?.MonthMinus1 || [],
                  COMPLETEUSER.projectMap?.MonthMinus2 || [],
                  false
                );

                updateLogList.push(updateLog);

                if (UserJiraUIDS.length == i + 1) {
                  // const startDepartData = await setCentralData(hourworklog, updateLogList.filter(y => y.success))

                  console.log("DONE WORKLOGS");
                  return {
                    status: true,
                    // startDepartData
                    updateLogList,
                  };
                }
              } else {
                // format karna padega
                const month0 = processor.filter(
                  (m) =>
                    m.started >= GetWantStartMonth0 &&
                    m.started <= GetWantFinishMonth0
                );
                const month1 = processor.filter(
                  (m) =>
                    m.started >= GetWantStartMonth1 &&
                    m.started <= GetWantFinishMonth1
                );
                const month2 = processor.filter(
                  (m) =>
                    m.started >= GetWantStartMonth2 &&
                    m.started <= GetWantFinishMonth2
                );
                // const monthX = processor.filter(m => ( m.started >= GetWantStartMonthX) && ( m.started <= GetWantFinishMonthX));

                const time1 = month0
                  .map((w) => w.timeSeconds)
                  .reduce((f, s) => f + s, 0);
                const time2 = month1
                  .map((w) => w.timeSeconds)
                  .reduce((f, s) => f + s, 0);
                const time3 = month2
                  .map((w) => w.timeSeconds)
                  .reduce((f, s) => f + s, 0);
                // const timeX = monthX.map(w => w.timeSeconds).reduce((f, s) => f + s, 0);

                // const updateMyUser = await myDB.collection(DB_USERS).updateOne({"jiraUser.accountId": jiraID}, {
                //     $set:{
                //         "issueIDZ.timeSpent1":time1,
                //         "issueIDZ.timeSpent2":time2,
                //         "issueIDZ.timeSpent3":time3,
                //     }
                // })

                // console.log("projectMap2", COMPLETEUSER.projectMap?.MonthMinus2)

                const updateLog = await updateNoLogs(
                  jiraID,
                  true,
                  COMPLETEUSER.azureUser?.department,
                  // hourworklog, howLong,
                  COMPLETEUSER.projectTree?.MonthMinus0 || [],
                  COMPLETEUSER.projectTree?.MonthMinus1 || [],
                  COMPLETEUSER.projectTree?.MonthMinus2 || [],
                  processor,
                  time1,
                  time2,
                  time3, //timeX,
                  rTe.responseTeams0,
                  // rTe.responseTeams1, rTe.responseTeams2,
                  COMPLETEUSER.projectMap?.MonthMinus0 || [],
                  COMPLETEUSER.projectMap?.MonthMinus1 || [],
                  COMPLETEUSER.projectMap?.MonthMinus2 || [],
                  false
                );

                updateLogList.push(updateLog);

                if (UserJiraUIDS.length == i + 1) {
                  //    const startDepartData = await setCentralData(hourworklog, updateLogList.filter(y => y.success))

                  console.log("DONE WORKLOGS");
                  return {
                    status: true, // startDepartData
                    updateLogList,
                  };
                }
              }
            }
          } catch (err) {
            console.log("Failed to fetch teams logs", err);
            // console.log('err', err)
            const ONBOARDING_USERSUPDATE = await myDB
              .collection(DB_ONBOARDING)
              .updateOne(
                { tag: DB_ONBOARDING_DOC_USERS },
                {
                  $push: {
                    "hour.errorWorklogs":
                      "err: jid " + jiraID + " " + JSON.stringify(err),
                  },
                }
              );

            return { success: false, error: err };
          }
        }
      }
    }
  },
};

function divideArray(array, size) {
  const dividedArray = [];
  for (let i = 0; i < array.length; i += size) {
    dividedArray.push(array.slice(i, i + size));
  }
  return dividedArray;
}
// Helper function to create a delay using Promises
// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

async function shiftNEXTUID(hourworklog, howLong, timesCount) {
  const ONBOARDING_USERSUPDATE = await myDB.collection(DB_ONBOARDING).updateOne(
    { tag: DB_ONBOARDING_DOC_USERS },
    {
      $set: {
        "hour.worklogs": hourworklog >= howLong ? 0 : hourworklog + 1,
        "hour.worklogTime": timesCount + 1,
        "hour.worklogTotal": howLong,
      },
    }
  );
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getLast30DaysDates() {
  let datesArray = [];
  let today = new Date(CurrentDate);
  today.setHours(0, 0, 0, 0); // Set to 00:00:00.000

  for (let i = 0; i < 31; i++) {
    let date = new Date(today);
    date.setDate(today.getDate() - i);
    datesArray.push(date.toISOString().split("T")[0]); // Format date as YYYY-MM-DD
  }
  return datesArray;
}

async function updateNoLogs(
  jiraID,
  status,
  userDepart,
  // hourworklog, howLong,
  monthW0MAP,
  monthW1MAP,
  monthW2MAP,
  processed,
  time1,
  time2,
  time3, //timeX,
  responseTeams0,
  // responseTeams1, responseTeams2,
  projectMap0,
  projectMap1,
  projectMap2,
  suspended
) {
  console.log("CALLED PROCESSOR");

  // let MANUALWORKLOGSFROMDB = await myDB.collection(DB_USER_WORKLOGS).findOne({ jiraID: jiraID });
  // MANUALWORKLOGSFROMDB = MANUALWORKLOGSFROMDB?.manualWorklogs?.map(e => {
  //     return {
  //       title: e.title,
  //       description: e.description,
  //       stage1: e.stage1, stage2: e.stage2,
  //       start: e.startDate,
  //       date: new Date( e.startDate).getDate(),
  //     //   month: new Date( e.startDate ).getMonth(),
  //       timeSeconds: e.timeSeconds
  //     }
  //   }) || [];

  // let processManual = MANUALWORKLOGSFROMDB.filter(d => d.stage1 == 'PROJECT' && (new Date(d.start)) >= (new Date(GetWantStartMonth2)) && (new Date(d.start)) <= (new Date(GetWantFinishMonth0))).map(d => d.stage2)

  // if(processManual.length > 0){
  //     processManual = [...new Set(processManual)]
  //     processManual = await myDB.collection(DB_PROJECTS).find({projectId:{$in:processManual}}).project({"projectId":1,"name":1,"key":1,"_id":0}).toArray() || []
  // }

  // let MANUALWORKLOGSFROMDB0 = MANUALWORKLOGSFROMDB.filter(d => (new Date(d.start)) >= (new Date(GetWantStartMonth0)) && (new Date(d.start)) <= (new Date(GetWantFinishMonth0)))
  // let MANUALWORKLOGSFROMDB1 = MANUALWORKLOGSFROMDB.filter(d => (new Date(d.start)) >= (new Date(GetWantStartMonth1)) && (new Date(d.start)) <= (new Date(GetWantFinishMonth1)))
  // let MANUALWORKLOGSFROMDB2 = MANUALWORKLOGSFROMDB.filter(d => (new Date(d.start)) >= (new Date(GetWantStartMonth2)) && (new Date(d.start)) <= (new Date(GetWantFinishMonth2)))
  // console.log("MANUALWORKLOGSFROMDB", MANUALWORKLOGSFROMDB0, MANUALWORKLOGSFROMDB1, MANUALWORKLOGSFROMDB2)
  // MANUALWORKLOGSFROMDB = null;
  // console.log("MANUALWORKLOGSFROMDB0", MANUALWORKLOGSFROMDB0.length, MANUALWORKLOGSFROMDB1.length, MANUALWORKLOGSFROMDB2.length)

  let monthW0 = [
    26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  ];
  let monthW1 = [
    26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  ];
  let monthW2 = [
    26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  ];
  // let monthWX = [];

  let thisMon0 = new Date(GetWantFinishMonth0);
  let thisMon1 = new Date(GetWantFinishMonth1);
  let thisMon2 = new Date(GetWantFinishMonth2);

  let yearC0 = thisMon0.getFullYear().toLocaleString();
  let monthC0 = thisMon0.getMonth().toLocaleString();
  let issuSAV0 = `history.${"ON_" + yearC0 + "_" + (monthC0 + 1)}`;

  let yearC1 = thisMon1.getFullYear().toLocaleString();
  let monthC1 = thisMon1.getMonth().toLocaleString();
  let issuSAV1 = `history.${"ON_" + yearC1 + "_" + (monthC1 + 2)}`;

  let yearC2 = thisMon2.getFullYear().toLocaleString();
  let monthC2 = thisMon2.getMonth().toLocaleString();
  let issuSAV2 = `history.${"ON_" + yearC2 + "_" + (monthC2 + 3)}`;

  monthW0 = monthW0.filter(
    (d) =>
      !(d > getLastDayOfMonth(thisMon0.getFullYear(), thisMon0.getMonth() + 1))
  );
  monthW1 = monthW1.filter(
    (d) =>
      !(d > getLastDayOfMonth(thisMon1.getFullYear(), thisMon1.getMonth() + 2))
  );
  monthW2 = monthW2.filter(
    (d) =>
      !(d > getLastDayOfMonth(thisMon2.getFullYear(), thisMon2.getMonth() + 3))
  );
  // last 30 days
  // monthWX = getLast30DaysDates();

  // console.log("responseTeams0",responseTeams0)

  monthW0 = createDatesArray(monthW0, GetWantFinishMonth0, GetWantFinishMonth0);
  monthW1 = createDatesArray(monthW1, GetWantFinishMonth1, GetWantFinishMonth1);
  monthW2 = createDatesArray(monthW2, GetWantFinishMonth2, GetWantFinishMonth2);

  if (!status) {
    let createChange = {
      "projectMap.MonthMinus0": monthW0,
      "projectMap.MonthMinus1": monthW1,
      "projectMap.MonthMinus2": monthW2,
      "projectMap.DayMinus30": [], //monthWX,
      "projectMap.worklogs": [],
      "issueIDZ.timeSpent1": time1,
      "issueIDZ.timeSpent2": time2,
      "issueIDZ.timeSpent3": time3,
      "issueIDZ.timeSpentX30": 0, //timeX,
      "issueIDZ.teamsLog1": 0, //responseTeams0.map(w => w.timeSeconds).reduce((f, s) => f + s, 0),
      "issueIDZ.teamsLog2": 0, //responseTeams1.map(w => w.timeSeconds).reduce((f, s) => f + s, 0),
      "issueIDZ.teamsLog3": 0, //responseTeams2.map(w => w.timeSeconds).reduce((f, s) => f + s, 0),
      testsky: -58,
    };

    if (suspended) {
      createChange["suspended"] = true;
    }
    const updateMyUser = await myDB.collection(DB_USERS).updateOne(
      { "jiraUser.accountId": jiraID },
      {
        $set: createChange,
      }
    );
    const updateMyIssues = await myDB.collection(DB_USER_WORKLOGS).updateOne(
      { jiraID: jiraID },
      {
        $set: {
          worklogs: processed,
          [issuSAV0]: {
            updated: CurrentDate,
            logs: monthW0,
          },
          [issuSAV1]: {
            updated: CurrentDate,
            logs: monthW1,
          },
          [issuSAV2]: {
            updated: CurrentDate,
            logs: monthW2,
          },
          testsky: -58,
        },
      }
    );

    return {
      success: true,
      // processed,
      monthW0,
      monthW1,
      monthW2,
      // GetWantStartMonthX,
      // GetWantFinishMonthX,
      // monthWX,
      // when:"false-status"
      userDepart,
    };
  } else {
    for (let u = 0; u < processed.length; u++) {
      const wl = processed[u];
      let checkByDate = new Date(wl.started).getDate();
      // let checkByMonth = (new Date(wl.started).getDate())+' '+(new Date(wl.started).getMonth());

      // attension needed
      if (monthW0MAP.length > 0) {
        if (
          wl.started >= GetWantStartMonth0 &&
          wl.started <= GetWantFinishMonth0
        ) {
          let projectTree = monthW0MAP.find((tx) =>
            tx.issue.map((j) => j.key)?.includes(wl.issueKey)
          );
          let s = monthW0.findIndex((mx) => mx.date == checkByDate);
          let g = monthW0[s];

          // if(wl.issueKey == "XP-624"){
          //     console.log("rogue Start", projectTree ,  wl)
          // }
          // if(checkByDate == 12){
          //     console.log("rogue Start", (projectTree ? true :false),  monthW0[s])
          // }

          if (projectTree) {
            let gi = g.projects.findIndex(
              (mx) => mx.project == projectTree.project
            );
            // monthW0[s].loggedTime += wl.timeSeconds;

            let issueNow = {
              issueId: wl.issueId,
              issueKey: wl.issueKey,
              timeSeconds: [wl.timeSeconds],
              timeestimate:
                projectTree.issue.find((j) => j.key == wl.issueKey).est || 0,
              designate: projectTree.designate || 0,
            };
            if (gi >= 0) {
              let vi = g.projects[gi].issues.findIndex(
                (mx) => mx == wl.issueId
              );
              if (vi >= 0) {
                monthW0[s].loggedTime += wl.timeSeconds;

                monthW0[s].projects[gi].issueList[vi].timeSeconds.push(
                  ...issueNow.timeSeconds
                );
                monthW0[s].projects[gi].loggedTime += wl.timeSeconds;
              } else {
                monthW0[s].loggedTime += wl.timeSeconds;
                // create & push issues
                monthW0[s].projects[gi].loggedTime += wl.timeSeconds;
                monthW0[s].projects[gi].issues.push(issueNow.issueKey);
                monthW0[s].projects[gi].issueList.push(issueNow);
              }
            } else {
              monthW0[s].loggedTime += wl.timeSeconds;
              // create & push project
              monthW0[s].projects.push({
                project: projectTree.project,
                projectname: projectTree.projectname,
                key: projectTree.key,
                loggedTime: wl.timeSeconds,
                timeestimate: 0,
                designate: 0,
                // manual:0,
                issues: [issueNow.issueKey],
                issueList: [issueNow],
                // manualList:[],
                approved: null,
              });
            }
          } else {
            console.log("No Project Tree1", wl.issueKey);
          }

          // if(checkByDate == 12){
          //     console.log("rogue Final", wl.timeSeconds, monthW0[s])
          // }
        }
      }

      // attension needed
      if (monthW1MAP.length > 0) {
        if (
          wl.started >= GetWantStartMonth1 &&
          wl.started <= GetWantFinishMonth1
        ) {
          let projectTree = monthW1MAP.find((tx) =>
            tx.issue.map((j) => j.key)?.includes(wl.issueKey)
          );
          let s = monthW1.findIndex((mx) => mx.date == checkByDate);
          let g = monthW1[s];

          // if(wl.issueKey == "XP-624"){
          //     console.log("rogue Lost",  wl, GetWantStartMonth1, GetWantFinishMonth1)
          // }

          if (projectTree) {
            let gi = g.projects.findIndex(
              (mx) => mx.project == projectTree.project
            );
            // monthW1[s].loggedTime += wl.timeSeconds;

            let issueNow = {
              issueId: wl.issueId,
              issueKey: wl.issueKey,
              timeSeconds: [wl.timeSeconds],
              timeestimate:
                projectTree.issue.find((j) => j.key == wl.issueKey).est || 0,
              designate: projectTree.designate || 0,
            };
            if (gi >= 0) {
              let vi = g.projects[gi].issues.findIndex(
                (mx) => mx == wl.issueId
              );
              if (vi >= 0) {
                monthW1[s].projects[gi].loggedTime += wl.timeSeconds;

                monthW1[s].projects[gi].issueList[vi].timeSeconds.push(
                  ...issueNow.timeSeconds
                );
                monthW1[s].projects[gi].loggedTime += wl.timeSeconds;
              } else {
                monthW1[s].loggedTime += wl.timeSeconds;
                // create & push issues
                monthW1[s].projects[gi].loggedTime += wl.timeSeconds;
                monthW1[s].projects[gi].issues.push(issueNow.issueKey);
                monthW1[s].projects[gi].issueList.push(issueNow);
              }
            } else {
              monthW1[s].loggedTime += wl.timeSeconds;
              // create & push project
              monthW1[s].projects.push({
                project: projectTree.project,
                projectname: projectTree.projectname,
                key: projectTree.key,
                loggedTime: wl.timeSeconds,
                timeestimate: 0,
                designate: 0,
                // manual:0,
                issues: [issueNow.issueKey],
                issueList: [issueNow],
                // manualList:[],
                approved: null,
              });
            }
          } else {
            console.log("No Project Tree2", wl.issueKey);
          }
        }
      }

      // attension needed
      if (monthW2MAP.length > 0) {
        if (
          wl.started >= GetWantStartMonth2 &&
          wl.started <= GetWantFinishMonth2
        ) {
          let projectTree = monthW2MAP.find((tx) =>
            tx.issue.map((j) => j.key)?.includes(wl.issueKey)
          );
          let s = monthW2.findIndex((mx) => mx.date == checkByDate);
          let g = monthW2[s];

          if (projectTree) {
            let gi = g.projects.findIndex(
              (mx) => mx.project == projectTree.project
            );
            // monthW2[s].loggedTime += wl.timeSeconds;

            let issueNow = {
              issueId: wl.issueId,
              issueKey: wl.issueKey,
              timeSeconds: [wl.timeSeconds],
              timeestimate:
                projectTree.issue.find((j) => j.key == wl.issueKey).est || 0,
              designate: projectTree.designate || 0,
            };
            if (gi >= 0) {
              let vi = g.projects[gi].issues.findIndex(
                (mx) => mx == wl.issueId
              );
              if (vi >= 1) {
                monthW2[s].loggedTime += wl.timeSeconds;

                monthW2[s].projects[gi].issueList[vi].timeSeconds.push(
                  ...issueNow.timeSeconds
                );
                monthW2[s].projects[gi].loggedTime += wl.timeSeconds;
              } else {
                monthW2[s].loggedTime += wl.timeSeconds;
                // create & push issues
                monthW2[s].projects[gi].loggedTime += wl.timeSeconds;
                monthW2[s].projects[gi].issues.push(issueNow.issueKey);
                monthW2[s].projects[gi].issueList.push(issueNow);
              }
            } else {
              monthW2[s].loggedTime += wl.timeSeconds;
              // create & push project
              monthW2[s].projects.push({
                project: projectTree.project,
                projectname: projectTree.projectname,
                key: projectTree.key,
                loggedTime: wl.timeSeconds,
                timeestimate: 0,
                designate: 0,
                // manual:0,
                issues: [issueNow.issueKey],
                issueList: [issueNow],
                // manualList:[],
                approved: null,
              });
            }
          } else {
            console.log("No Project Tree3", wl.issueKey);
          }
        }
      }

      synchroniseUpdateHrs(
        [...projectMap0, ...projectMap1, ...projectMap2],
        monthW0
      );
      synchroniseUpdateHrs(
        [...projectMap0, ...projectMap1, ...projectMap2],
        monthW1
      );
      synchroniseUpdateHrs(
        [...projectMap0, ...projectMap1, ...projectMap2],
        monthW2
      );

      const updateMyUser = await myDB.collection(DB_USERS).updateOne(
        { "jiraUser.accountId": jiraID },
        {
          $set: {
            "projectMap.MonthMinus0": monthW0,
            "projectMap.MonthMinus1": monthW1,
            "projectMap.MonthMinus2": monthW2,
            "projectMap.DayMinus30": [], //monthWX,
            "projectMap.worklogs": processed,
            "issueIDZ.timeSpent1": time1,
            "issueIDZ.timeSpent2": time2,
            "issueIDZ.timeSpent3": time3,
            "issueIDZ.timeSpentX30": 0, //timeX,
            "issueIDZ.teamsLog1": 0, //responseTeams0.map(w => w.timeSeconds).reduce((f, s) => f + s, 0),
            "issueIDZ.teamsLog2": 0, //responseTeams1.map(w => w.timeSeconds).reduce((f, s) => f + s, 0),
            "issueIDZ.teamsLog3": 0, //responseTeams2.map(w => w.timeSeconds).reduce((f, s) => f + s, 0),
            testsky: -58,
          },
          $unset: {
            suspended: 1,
          },
        }
      );
      const updateMyIssues = await myDB.collection(DB_USER_WORKLOGS).updateOne(
        { jiraID: jiraID },
        {
          $set: {
            issues: processed,
            [issuSAV0]: {
              updated: CurrentDate,
              // teams: [], //responseTeams0,
              logs: monthW0,
            },
            [issuSAV1]: {
              updated: CurrentDate,
              // teams:[], // responseTeams1,
              logs: monthW1,
            },
            [issuSAV2]: {
              updated: CurrentDate,
              // teams:[], //responseTeams2,
              logs: monthW2,
            },
            testsky: -58,
          },
        }
      );

      console.log("EXIT PROCESSOR ", u);

      if (processed.length == u + 1) {
        return {
          success: true,
          // processed,
          monthW0,
          monthW1,
          monthW2,
          // GetWantStartMonthX,
          // GetWantFinishMonthX,
          // monthWX
          userDepart,
        };
      }
    }
  }
}

/*
async function upgradeCentralData( monthW0, monthW1, monthW2, userDepart, upgradeZ ) {
    console.log("start Department")


    // const timestamp = new Date();
    // const currentDate = new Date(timestamp);
    let createDepartName = userDepart.toLowerCase().split(' ').join('_').split('&').join('and')
    console.log(createDepartName)

    let upgradeX = {
        // worklogLoop:hourworklog,
        // worklogTotal:howLong,
        all3Months:[],
        // all3MonthsActive:[],
        [`listDepartments.department_${createDepartName}`]:[],
        // [`listDepartments.department_${createDepartName}`]:[],
        // updated: currentDate
    }

    upgradeX.all3Months.push(...monthW2.map(q => { //console.log("projects", q.projects.map(p => p.project)); 
    return {loggedTime:q.loggedTime, planned:q.planned, 
        activeProjects:q.projects.map(p => p.project), 
        tasks:q.projects.map(p => p.issues.length).reduce((f, s) => f + s, 0), 
        on:q.on, d:(new Date( 
            q.on.split('-')[2], 
            (q.on.split('-')[1] - 1), 
            q.on.split('-')[0] 
        ) )}}))

    upgradeX.all3Months.push(...monthW1.map(q => { //console.log("projects", q.projects.map(p => p.project)); 
    return {loggedTime:q.loggedTime, planned:q.planned, 
        activeProjects:q.projects.map(p => p.project), 
        tasks:q.projects.map(p => p.issues.length).reduce((f, s) => f + s, 0), 
        on:q.on, d:(new Date( 
            q.on.split('-')[2], 
            (q.on.split('-')[1] - 1),  
            q.on.split('-')[0] 
        ) )}}))

    upgradeX.all3Months.push(...monthW0.map(q => { // console.log("projects", q.projects.map(p => p.project)); 
    return {loggedTime:q.loggedTime, planned:q.planned, 
        activeProjects:q.projects.map(p => p.project), 
        tasks:q.projects.map(p => p.issues.length).reduce((f, s) => f + s, 0), 
        on:q.on, d:(new Date( 
            q.on.split('-')[2],
            (q.on.split('-')[1] - 1), 
            q.on.split('-')[0] 
        ) )}}))

    upgradeX[`listDepartments.department_${createDepartName}`] = [];
    upgradeX[`listDepartments.department_${createDepartName}`].push(...monthW2.map(q => { 

        return {loggedTime:q.loggedTime, planned:q.planned, activeProjects:q.projects.map(p => p.project), tasks:q.projects.map(p => p.issues.length).reduce((f, s) => f + s, 0), on:q.on, 
            d:(new Date( 
                q.on.split('-')[2], 
                (q.on.split('-')[1] - 1),
                q.on.split('-')[0] 
            ) )}}))

    upgradeX[`listDepartments.department_${createDepartName}`].push(...monthW1.map(q => { 
        return {loggedTime:q.loggedTime, planned:q.planned, activeProjects:q.projects.map(p => p.project), tasks:q.projects.map(p => p.issues.length).reduce((f, s) => f + s, 0), on:q.on,
            d:(new Date( 
                q.on.split('-')[2], 
                (q.on.split('-')[1] - 1),
                q.on.split('-')[0] ) 
            )}}))
            
    upgradeX[`listDepartments.department_${createDepartName}`].push(...monthW0.map(q => { 
        return {loggedTime:q.loggedTime, planned:q.planned, activeProjects:q.projects.map(p => p.project), tasks:q.projects.map(p => p.issues.length).reduce((f, s) => f + s, 0), on:q.on, 
            d:(new Date( 
                q.on.split('-')[2], 
                (q.on.split('-')[1] - 1),
                q.on.split('-')[0] 
            ) )}}))



    await upgradeZ.all3Months.map(q => {
        if(q.loggedTime > 0){
        let d = upgradeX.all3Months.findIndex(r => r.on == q.on)
        if(d >= 0){
            upgradeX.all3Months[d].activeProjects.push(
                ...q.activeProjects.filter(t => !upgradeX.all3Months[d].activeProjects.includes(t))
            );
            upgradeX.all3Months[d].loggedTime += q.loggedTime;
            upgradeX.all3Months[d].planned += q.planned;
            upgradeX.all3Months[d].tasks += q.tasks;
        }}
        return q.on;
    })



    await upgradeZ[`listDepartments.department_${createDepartName}`].map(q => {
        // if(q.loggedTime > 0){
        let d = upgradeX[`listDepartments.department_${createDepartName}`].findIndex(r => r.on == q.on)
        if(d >= 0){
            // console.log(upgradeX[`listDepartments.department_${createDepartName}`][d], q)

            upgradeX[`listDepartments.department_${createDepartName}`][d].loggedTime += q.loggedTime;
            upgradeX[`listDepartments.department_${createDepartName}`][d].planned += q.planned;
            // console.log("LAS",  q.activeProjects, "NEW", upgradeX[`listDepartments.department_${createDepartName}`][d].activeProjects )


            upgradeX[`listDepartments.department_${createDepartName}`][d].activeProjects.push(
                ...q.activeProjects.filter(t => !upgradeX[`listDepartments.department_${createDepartName}`][d].activeProjects.includes(t))
            );
            upgradeX[`listDepartments.department_${createDepartName}`][d].tasks += q.tasks;
        }
    // }
        return q.on;
    })
    








    return upgradeX
}
*/
/*
async function setCentralData(hourworklog, updateLogList){
    // return {hourworklog, updateLogList}
    
    // const didIT = await updateLogList.map( y => {
    //     upgradeCentralData( y.monthW0, y.monthW1, y.monthW2, y.userDepart );
        
    // // console.log("didIT", departing)
    //     return y.userDepart
    // })

    let upgradeZ = {
    }


    let DEPART = await myDB.collection(DB_ONBOARDING).findOne({tag:DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW});
    let DEPARTLITE = await myDB.collection(DB_ONBOARDING).findOne({tag:DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE});

    upgradeZ["all3Months"] = DEPART.all3Months || [];
    DEPARTLITE.allDepartments.map(y => {
        let createDepartNameZ = y.toLowerCase().split(' ').join('_').split('&').join('and')
        upgradeZ[`listDepartments.department_${createDepartNameZ}`] = DEPART.listDepartments[`department_${createDepartNameZ}`] || [];
    })


    for (let i = 0; i < updateLogList.length; i++) {
        let createDepartName = updateLogList[i].userDepart.toLowerCase().split(' ').join('_').split('&').join('and')
        // console.log('starting', createDepartName)

        let didIT = await upgradeCentralData( updateLogList[i].monthW0, updateLogList[i].monthW1, updateLogList[i].monthW2, updateLogList[i].userDepart , upgradeZ);
        // console.log("upgradeCentralData", updateLogList[i].userDepart)


        upgradeZ.all3Months = didIT.all3Months;
        upgradeZ[`listDepartments.department_${createDepartName}`] = didIT[`listDepartments.department_${createDepartName}`]


       
        if((i+1) == updateLogList.length){ 
    // return {upgradeZ, updateLogList}

            
            // console.log("didIT DONE", didIT)

        // DEPARTLITE.allDepartments.map(y => {
        //     let createDepartNameZ = y.toLowerCase().split(' ').join('_').split('&').join('and')
        //     if(!upgradeZ[`listDepartments.department_${createDepartNameZ}`]){
        //         // console.log("SATANIC", createDepartNameZ)
        //     }else{
        //     upgradeZ[`listDepartments.department_${createDepartNameZ}`] = upgradeZ[`listDepartments.department_${createDepartNameZ}`].map(r => {
        //         let rX = r;
        //         rX.activeProjects =  rX.activeProjects
        //         return rX
        //     })
        //     }
        // })


    if(hourworklog == 0 ){
        console.log("Updating departments to final actives")

        let upgradeY = {

        }

        upgradeY["all3MonthsActive"] = []; // update all active
        upgradeY.all3MonthsActive.push(...upgradeZ["all3Months"])

        // upgradeZ["all3MonthsActive"] = null; // update all active
        upgradeZ["all3Months"] = []; // clear all now

        DEPARTLITE.allDepartments.map(dp => {
            let createDepartNameX = dp.toLowerCase().split(' ').join('_').split('&').join('and')

            upgradeY[`activeDepartments.department_${createDepartNameX}_Active`] = []; // update all active
            upgradeY[`activeDepartments.department_${createDepartNameX}_Active`].push(...upgradeZ[`listDepartments.department_${createDepartNameX}`])

            // upgradeZ[`activeDepartments.department_${createDepartNameX}_Active`] = null; // clean Old mess
            upgradeZ[`listDepartments.department_${createDepartNameX}`] = []; // clear all now
        })

        upgradeY['testsky'] = -58
        upgradeZ['testsky'] = -58


        const resultUpdateDB_DEPARTMENTS = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_ACTIVE}, { $set: upgradeY })
    }



        // upgradeZ[`listDepartments.department_${createDepartName}`][d].activeProjects = [...new Set( ...upgradeX[`listDepartments.department_${createDepartName}`][d].activeProjects )]

        const resultUpdateDB_DEPARTMENTS = await myDB.collection(DB_ONBOARDING).updateOne({tag: DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW}, { $set: upgradeZ })
            return { status: true, upgradeZ }
        

// return { status: "testing", 
// monthW0:updateLogList[i].monthW0, 
// monthW1:updateLogList[i].monthW1, 
// monthW2:updateLogList[i].monthW2, 
// }
        }

    }

}


  */

function createDatesArray(monthWX, GetWantFinishMonthX, GetWantStartMonthX) {
  return monthWX.map((d) => {
    let mon = GetWantFinishMonthX.getMonth();

    let rmX = {
      date: d, //test:from,
      on: `${d}-${d < 26 ? mon + 1 : mon == 0 ? 12 : mon}-${
        d < 26
          ? GetWantFinishMonthX.getFullYear()
          : GetWantStartMonthX.getFullYear()
      }`,
      loggedTime: 0,
      planned: 0,
      designate: 0,

      projects: [],
    };
    return rmX;
  });
}

function synchroniseUpdateHrs(oldArr, newArr) {
  newArr.forEach((newObj) => {
    const oldObj = oldArr.find((oldObj) => oldObj.on === newObj.on);
    if (oldObj) {
      newObj.projects.forEach((newBObj) => {
        const oldBObj = oldObj.projects.find(
          (oldBObj) => oldBObj.projectname === newBObj.projectname
        );
        if (oldBObj && oldBObj.updHrs) {
          newBObj.updHrs = oldBObj.updHrs;
        }
      });
    }
  });
}
