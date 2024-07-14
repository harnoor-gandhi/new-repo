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
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_KNOW,
  DB_ONBOARDING_DOC_SKILLS,
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE,
  // ProdDB, CLOUD_INSTANCE
} = require("../backendHttpTrigger/credsStore");

const myDB = mongoose.connection.useDb(useDB_PROD);

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getWorkingDays(startDate, endDateX) {
  const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  let workingDays = 0;
  let currentDate = new Date(startDate);

  let endDate = new Date(endDateX);

  currentDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 59);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setTime(currentDate.getTime() + oneDay); // Move to the next day
  }

  return workingDays;
}

module.exports = {
  onBoardCapacities: async function (via) {
    let processPerHour = 450; // stretch it based on timeout

    // console.log({success:true, via:via})
    if (via !== "CREATED" && via !== "MANUALY" && via !== "SCHEDULED") {
      return {
        status: false,
        err: "You don't know what your doing, please consider proper training!",
      };
    } else {
      let timestamp = Date.now();
      const currentDate = new Date(timestamp);

      let ISSUELIST = await myDB
        .collection(DB_ISSUES)
        .find(
          {
            // jiraID:'641992310e6828ab2025df10'
          },
          { limit: processPerHour, skip: 0 }
        )
        .toArray();

      let BOARDSDOC = await myDB.collection(DB_BOARDS).find({}).toArray();
      let combinedCapacity = 0;
      let capacityDept = {};

      for (let i = 0; i < ISSUELIST.length; i++) {
        let issuePlannedSCRUM = ISSUELIST[i].issues
          .filter((o) => o.boardId && o.issuetype == "Task")
          .map((e) => {
            let daysSprint =
              BOARDSDOC.filter((o) => o.boardId == e.boardId)
                .sprints.filter((o) => o.state == "active")
                .map((o) =>
                  getWorkingDays(new Date(o.startDate), new Date(o.endDate))
                )[0] || 0;

            let eX = e;
            eX.timeestimate =
              (daysSprint <= 0
                ? e.timeestimate
                : e.timeestimate / daysSprint) || 0;
            // eX.timeestimate = e.timeestimate / daysSprint || 0;
            return eX;
          });

        // issuePlannedSCRUM = issuePlannedSCRUM.map(t => t.timeestimate||0 ).reduce((f, s) => f + s, 0)

        let issueSCRUM = ISSUELIST[i].issues
          .filter(
            (o) =>
              o.boardId &&
              o.issuetype == "Sub-task" &&
              o.summary?.toLowerCase().includes("-capacity-")
          )
          .sort((a, b) => new Date(b.created) - new Date(a.created));

        issueSCRUM = issueSCRUM
          .reduce(
            (acc, curr) =>
              acc.some((item) => item.projectName === curr.projectName)
                ? acc
                : [...acc, curr],
            []
          )
          .map((e) => {
            // console.log(e)
            let daysSprint =
              BOARDSDOC.filter((o) => o.boardId == e.boardId)[0]
                .sprints.filter((o) => o.state == "active")
                .map((o) =>
                  getWorkingDays(new Date(o.resolved), new Date(o.endDate))
                )[0] || 0;

            let eX = e;
            eX.dayZ = daysSprint;

            eX.timeestimate =
              (daysSprint <= 0
                ? e.timeestimate
                : e.timeestimate / daysSprint) || 0;
            return eX;
          });

        let issueKANBAN = ISSUELIST[i].issues
          .filter(
            (o) =>
              !o.boardId &&
              o.issuetype == "Sub-task" &&
              o.summary?.toLowerCase().includes("-capacity-")
          )
          .sort((a, b) => new Date(b.created) - new Date(a.created));
        issueKANBAN = issueKANBAN.reduce(
          (acc, curr) =>
            acc.some((item) => item.projectName === curr.projectName)
              ? acc
              : [...acc, curr],
          []
        );

        let newUpdate = {
          "issueIDZ.planScrum": issuePlannedSCRUM.map((e) => {
            return {
              id: e.projectID,
              issue: e.key,
              name: e.projectName,
              day: e.timeestimate || 0,
            };
          }), // static value
          "issueIDZ.planKanban": null, // static value

          "issueIDZ.planDay": issuePlannedSCRUM
            .map((e) => e.timeestimate || 0)
            .reduce((f, s) => f + s, 0),

          "issueIDZ.capScrum": issueSCRUM.map((e) => {
            return {
              id: e.projectID,
              // key:e.key,
              // dayZ: e.dayZ,
              name: e.projectName,
              day: e.timeestimate || 0,
            };
          }), // static value
          "issueIDZ.capKanban": issueKANBAN.map((e) => {
            return {
              id: e.projectID,
              name: e.projectName,
              day: e.timeestimate || 0,
            };
          }), // based on sprint
          "issueIDZ.capDay": [
            ...issueSCRUM.map((e) => e.timeestimate || 0),
            // ...issueKANBAN.map(e => e.timeestimate || 0)
          ].reduce((f, s) => f + s, 0),
        };

        let USERSDOCSX = await myDB
          .collection(DB_USERS)
          .updateOne(
            { "jiraUser.accountId": ISSUELIST[i].jiraID },
            { $set: newUpdate }
          );

        console.log("Updated", ISSUELIST[i].jiraID);

        if (ISSUELIST[i].department) {
          combinedCapacity += newUpdate["issueIDZ.capDay"] || 0;
          let nDept = ISSUELIST[i].department
            .toLowerCase()
            .split(" ")
            .join("_")
            .split("&")
            .join("and");

          if (!capacityDept[nDept]) {
            capacityDept[nDept] = 0;
          }
          capacityDept[nDept] += newUpdate["issueIDZ.capDay"] || 0;
        }

        if (ISSUELIST.length == i + 1) {
          let ONBOARDX = await myDB.collection(DB_ONBOARDING).updateOne(
            { tag: DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE },
            {
              $set: {
                combinedCapacity,
                resourceDepartmentsCapacity: capacityDept,
              },
            }
          );

          return {
            success: true,
            //issueSCRUM, issueKANBAN
            issuePlanned: issuePlannedSCRUM.map((e) => e.timeestimate || 0), //.reduce((f, s) => f + s, 0),
            issueCap: [
              ...issueSCRUM.map((e) => e.timeestimate || 0),
              ...issueKANBAN.map((e) => e.timeestimate || 0),
            ], //.reduce((f, s) => f + s, 0)
          };
        }
      }
    }
  },
};
