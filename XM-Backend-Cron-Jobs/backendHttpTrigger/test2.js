const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const {
  useDB_PROD,
  DB_ONBOARDING,
  DB_USERS,
  DB_ONBOARDING_DOC_USERS,
  JIRA_DOMAIN_URL,
  SECURITY_TOKEN,
  // ProdDB, CLOUD_INSTANCE
  KEYS,
} = require("./credsStore");

// const { onboardJiraIssues } = require("../services/onboard_issuePiranhas");
const { onboardJiraIssues } = require("../services/onboard_issueTurtles");
// const {onboardJiraIssues} = require('../services/onboard_issueWhales');
const { onboardJiraWorklogs } = require("../services/onboard_worklogs");
const { onBoardUsers } = require("../services/onboard_users");

const { onBoardCapacities } = require("../services/sync_capacity");
const { onBoardDepartments } = require("../services/sync_departments");
const { onBoardSkills } = require("../services/sync_skills");
const { onboardJiraProjects } = require("../services/onboard_projects");
const { onBoardOverview } = require("../services/sync_overview");
const { onBoardCerts } = require("../services/sync_certs");
const { onboardJiraSprints } = require("../services/onboard_sprints");

const myDB = mongoose.connection.useDb(useDB_PROD);

// async function name(myTimer) {

//     let USERSDOC = await myDB.collection(DB_USERS).find().toArray();

//     USERSDOC = await USERSDOC.map(m => {
//         return m.azureUser.department
//     })
//     USERSDOC = await [...new Set(USERSDOC)]

//     return USERSDOC
// }

router.get("/one", async (req, res) => {
  // const x = await name('')
  // const x = await onboardJiraIssues("SCHEDULED")
  // const x = await onboardJiraWorklogs("SCHEDULED");
  // const x = await onBoardUsers("SCHEDULED")
  // const x = await onboardJiraProjects("SCHEDULED")
  // const x = await onboardJiraSprints("SCHEDULED")

  const x = await onBoardCapacities("SCHEDULED");
  // const x = await onBoardDepartments("SCHEDULED")
  // const x = await onBoardSkills("SCHEDULED")
  // const x = await onBoardCerts("SCHEDULED")
  // const x = await onBoardOverview("SCHEDULED")

  res.json({ success: true, x });
}); // test route

module.exports = router;
