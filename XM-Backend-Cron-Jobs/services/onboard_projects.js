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
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW,
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE,
  DB_PROJECTOVERVIEW,
  // ProdDB, CLOUD_INSTANCE
} = require("./../backendHttpTrigger/credsStore");

async function get50ProjectsApi(startAt, maxResults) {
  const response = await axios.get(
    `https://${JIRA_DOMAIN_URL}rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}&orderBy=+name&expand=insight,lead,description`,
    {
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
  onboardJiraProjects: async function (via) {
    const myDB = mongoose.connection.useDb(useDB_PROD);
    console.log({ success: true, via: via });
    if (via !== "CREATED" && via !== "MANUALY" && via !== "SCHEDULED") {
      return {
        status: false,
        err: "You don't know what your doing, please consider proper training!",
      };
    } else {
      let startAt = 0;
      let maxResults = 50;
      let total = 1;
      let projects = [];
      let projectList = [];

      let OldMS_ProjectList = await myDB
        .collection(DB_ONBOARDING)
        .findOne({ tag: DB_ONBOARDING_DOC_PROJECTS }); //.project({projects:1});
      // console.log(OldMS_ProjectList)
      OldMS_ProjectList = OldMS_ProjectList["projects"];
      let checkCount = 0;
      let addedCount = 0;
      let updatedCount = 0;

      while (total > projects.length) {
        let data = await get50ProjectsApi(startAt, maxResults);

        if (startAt == 0) {
          total = data.total;
        }
        startAt += maxResults;
        projects.push(...data.values);
      }
      // if(total == projects.length){

      // check board still exist in list
      let checkAlternate = OldMS_ProjectList.filter(
        (oB) => !projects.some((nB) => nB.id === oB)
      );
      if (checkAlternate.length > 0) {
        // get rid of them from checklist
        console.log(
          "projects - get rid of them from checklist!",
          OldMS_ProjectList.length,
          projects.length,
          checkAlternate.length,
          checkAlternate
        );
      } else {
        console.log("No project changes no pullbacks");
      }

      const PROJECTSTREK = [];
      const ALLUSERS = await myDB.collection(DB_USERS).find().toArray();

      let USERS = await ALLUSERS.map((e) => {
        if (e.projectIDZ.MonthMinus1) {
          PROJECTSTREK.push(...e.projectIDZ.MonthMinus1);
        }
        return e?.projectIDZ?.MonthMinus1 || [];
      });

      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        let timestamp = Date.now() - 1;
        const currentDate = new Date(timestamp);

        let listDepartment = [];
        if (+projects[i].id == +"10120") {
          console.log(project);
        }

        let dcX = project.description?.trim() || "";
        let SOW = "";
        let Billable = null;
        if (dcX && dcX.includes("SOW") && dcX.includes("Billable")) {
          let dcZ = dcX.split("&&");
          if (dcZ.length >= 2) {
            SOW =
              dcZ
                .find((xc) => xc?.includes("SOW"))
                ?.split("=")[1]
                ?.trim() || "";

            if (
              dcZ
                .find((xc) => xc?.includes("Billable"))
                ?.split("=")[1]
                ?.trim()
                ?.toLowerCase() == "no"
            ) {
              Billable = false;
            }
            if (
              dcZ
                .find((xc) => xc?.includes("Billable"))
                ?.split("=")[1]
                ?.trim()
                ?.toLowerCase() == "yes"
            ) {
              Billable = true;
            }
          }
        }

        let newProject = {
          // type = kanban, scrum, agility
          id: "",

          projectId: project.id,
          self: project.self,
          key: project.key,
          projectTypeKey: project.projectTypeKey,
          name: project.name.trim(),
          isPrivate: project.isPrivate,
          simplified: project.simplified,
          style: project.style,
          insight: project.insight || null,
          properties: project.properties,
          avatarUrls: project.avatarUrls["24x24"],
          projectCategory: project.projectCategory,
          description: project.description || "",
          SOW,
          Billable,

          lead: {
            accountId: project.lead.accountId,
            displayName: project.lead.displayName,
          },
          manager: {
            accountId: "",
            displayName: "",
          },
          activeResources: 0,

          updated: timestamp,
          created: timestamp,
          updWOW: currentDate,
          creWOW: currentDate,
        };

        projectList.push({
          name: newProject.name,
          projectId: newProject.projectId,
          key: newProject.key,
          avatarUrls: newProject.avatarUrls.split("/project/avatar")[1],
          leadName: newProject.lead.displayName,
        });

        // let m = [
        //     'dipesh.bhoir@cloudeq.com',
        //     'happy.soni@cloudeq.com',
        //     'tushar.pareek@cloudeq.com'
        // ];

        let loggedHours = ALLUSERS.filter(
          (w) =>
            // m.includes(w.email) &&
            w.projectIDZ.MonthMinus0.includes(newProject.projectId) ||
            // m.includes(w.email) &&
            w.projectIDZ.MonthMinus1.includes(newProject.projectId) ||
            // m.includes(w.email)  &&
            w.projectIDZ.MonthMinus2.includes(newProject.projectId)
        );
        // console.log("emails", loggedHours.map(u => u.email))

        if (loggedHours.length > 0) {
          console.log("loggedHours", newProject.projectId, loggedHours.length);

          loggedHours.map((u) => {
            let n = u.azureUser.department
              ?.toLowerCase()
              .split(" ")
              .join("_")
              .split("&")
              .join("and");
            // if(!listDepartment[n] ){
            //     // listDepartment[n]  = []
            //     // listDepartment[`${n}_resources`]  = 0
            //     // listDepartment[`${n}_resourceList`]  = []
            //     listDepartment.push(...u.projectMap?.MonthMinus0.map(y => {let d = y.on.split('-'); return { on:y.on, date:new Date(d[2], (d[1] - 1 ), d[0]), loggedTime:y[`${n}_loggedTime`], [`${n}_resourceList`]: [u.jiraUser.accountId] }}));
            //     listDepartment.push(...u.projectMap?.MonthMinus1.map(y => {let d = y.on.split('-'); return { on:y.on, date:new Date(d[2], (d[1] - 1 ), d[0]), loggedTime:y[`${n}_loggedTime`], [`${n}_resourceList`]: [u.jiraUser.accountId] }}));
            //     listDepartment.push(...u.projectMap?.MonthMinus2.map(y => {let d = y.on.split('-'); return { on:y.on, date:new Date(d[2], (d[1] - 1 ), d[0]), loggedTime:y[`${n}_loggedTime`], [`${n}_resourceList`]: [u.jiraUser.accountId] }}));
            //     // listDepartment[`${n}_resources`] += 1
            //     // listDepartment[`${n}_resourceList`].push(u.jiraUser.accountId)
            //     return n;
            // }else{
            u.projectMap?.MonthMinus0.map((y) => {
              if (
                y.projects
                  .map((px) => px.project)
                  .includes(newProject.projectId)
              ) {
                let p = listDepartment.findIndex((o) => o == y);

                if (p >= 0) {
                  if (!listDepartment[p][`${n}_resourceList`]) {
                    listDepartment[p][`${n}_loggedTime`] = 0;
                    listDepartment[p][`${n}_planned`] = 0;
                    listDepartment[p][`${n}_issues`] = [];
                    listDepartment[p][`${n}_resourceList`] = [];
                  }
                  listDepartment[p][`${n}_loggedTime`] += y.loggedTime;
                  listDepartment[p][`${n}_planned`] += u.issueIDZ?.capDay || 0;
                  listDepartment[p][`${n}_issues`].push(
                    ...y.projects.map((po) => po.issues || []).flat()
                  );
                  listDepartment[p][`${n}_resourceList`].push(
                    u.jiraUser.accountId
                  );
                  // listDepartment[`${n}_resources`] += 1;
                  // listDepartment[`${n}_resourceList`].push(u.jiraUser.accountId)
                  return n;
                } else {
                  let d = y.on.split("-");
                  listDepartment.push({
                    on: y.on,
                    date: new Date(d[2], d[1] - 1, d[0]),
                    [`${n}_loggedTime`]: y.loggedTime,
                    [`${n}_planned`]: u.issueIDZ?.capDay || 0,
                    [`${n}_issues`]: [
                      ...y.projects.map((po) => po.issuesList || []).flat(),
                    ],
                    [`${n}_resourceList`]: [u.jiraUser.accountId],
                  });
                  return n;
                }
              } else {
                return n;
              }
            });
            u.projectMap?.MonthMinus1.map((y) => {
              if (
                y.projects
                  .map((px) => px.project)
                  .includes(newProject.projectId)
              ) {
                let p = listDepartment.findIndex((o) => o == y);

                if (p >= 0) {
                  if (!listDepartment[p][`${n}_resourceList`]) {
                    listDepartment[p][`${n}_loggedTime`] = 0;
                    listDepartment[p][`${n}_planned`] = 0;
                    listDepartment[p][`${n}_issues`] = [];
                    listDepartment[p][`${n}_resourceList`] = [];
                  }
                  listDepartment[p][`${n}_loggedTime`] += y.loggedTime;
                  listDepartment[p][`${n}_planned`] += u.issueIDZ?.capDay || 0;
                  listDepartment[p][`${n}_issues`].push(
                    ...y.projects.map((po) => po.issues || []).flat()
                  );
                  listDepartment[p][`${n}_resourceList`].push(
                    u.jiraUser.accountId
                  );
                  // listDepartment[`${n}_resources`] += 1;
                  // listDepartment[`${n}_resourceList`].push(u.jiraUser.accountId)
                  return n;
                } else {
                  let d = y.on.split("-");
                  listDepartment.push({
                    on: y.on,
                    date: new Date(d[2], d[1] - 1, d[0]),
                    [`${n}_loggedTime`]: y.loggedTime,
                    [`${n}_planned`]: u.issueIDZ?.capDay || 0,
                    [`${n}_issues`]: [
                      ...y.projects.map((po) => po.issues || []).flat(),
                    ],
                    [`${n}_resourceList`]: [u.jiraUser.accountId],
                  });
                  return n;
                }
              } else {
                return n;
              }
            });
            u.projectMap?.MonthMinus2.map((y) => {
              if (
                y.projects
                  .map((px) => px.project)
                  .includes(newProject.projectId)
              ) {
                let p = listDepartment.findIndex((o) => o == y);

                if (p >= 0) {
                  if (!listDepartment[p][`${n}_resourceList`]) {
                    listDepartment[p][`${n}_loggedTime`] = 0;
                    listDepartment[p][`${n}_planned`] = 0;
                    listDepartment[p][`${n}_issues`] = [];
                    listDepartment[p][`${n}_resourceList`] = [];
                  }
                  listDepartment[p][`${n}_loggedTime`] += y.loggedTime;
                  listDepartment[p][`${n}_planned`] += u.issueIDZ?.capDay || 0;
                  listDepartment[p][`${n}_issues`].push(
                    ...y.projects.map((po) => po.issues || []).flat()
                  );
                  listDepartment[p][`${n}_resourceList`].push(
                    u.jiraUser.accountId
                  );
                  // listDepartment[`${n}_resources`] += 1;
                  // listDepartment[`${n}_resourceList`].push(u.jiraUser.accountId)
                  return n;
                } else {
                  let d = y.on.split("-");
                  listDepartment.push({
                    on: y.on,
                    date: new Date(d[2], d[1] - 1, d[0]),
                    [`${n}_loggedTime`]: y.loggedTime,
                    [`${n}_planned`]: u.issueIDZ?.capDay || 0,
                    [`${n}_issues`]: [
                      ...y.projects.map((po) => po.issues || []).flat(),
                    ],
                    [`${n}_resourceList`]: [u.jiraUser.accountId],
                  });
                  return n;
                }
              } else {
                return n;
              }
            });
            // }
          });

          if (SOW) {
            const resultDB_SOWclean = await myDB
              .collection(DB_USERS)
              .updateMany(
                { "projectIDZ.SOW": SOW },
                {
                  $unset: {
                    "projectIDZ.allId": project.id,
                    "projectIDZ.SOW": SOW,
                  },
                  $unset: {
                    [`projectIDZ.billable.${newProject.projectId}`]: 1,
                  },
                }
              );
            // clean old fields

            const resultDB_SOW = await myDB.collection(DB_USERS).updateMany(
              {
                "jiraUser.accountId": {
                  $in: loggedHours.map((lh) => lh.jiraUser.accountId),
                },
              },
              {
                $push: {
                  "projectIDZ.allId": project.id,
                  "projectIDZ.SOW": SOW,
                },
                $set: {
                  [`projectIDZ.billable.${newProject.projectId}`]: {
                    id: newProject.projectId,
                    billable: newProject.Billable,
                    sow: newProject.SOW,
                  },
                },
              }
            );
          }
        }

        // check if document exist
        if (!OldMS_ProjectList.includes(newProject.projectId)) {
          console.log("Creating", newProject.projectId);
          // create if dosent

          const resultDB_PROJECTS = await myDB
            .collection(DB_PROJECTS)
            .insertOne(newProject);
          const resultUpdateDB_PROJECTS = await myDB
            .collection(DB_PROJECTS)
            .updateOne(
              { _id: resultDB_PROJECTS.insertedId },
              {
                $set: {
                  id: new ObjectId(resultDB_PROJECTS.insertedId).valueOf(),
                },
              }
            );

          const updateProject = await myDB.collection(DB_ONBOARDING).updateOne(
            { tag: DB_ONBOARDING_DOC_PROJECTS },
            {
              $push: {
                projects: newProject.projectId,
              },
              $set: {
                updated: {
                  via: via,
                  now: timestamp,
                  wow: currentDate,
                },
              },
            }
          );

          checkCount++;
          addedCount++;

          const resultCreateDB_OVERVIEW = await myDB
            .collection(DB_PROJECTOVERVIEW)
            .insertOne({
              projectId: project.id,
              key: newProject.key,
              name: newProject.name,

              boards: [],
              actors: [],

              updated: currentDate,
            });

          if (projects.length == i + 1) {
            return { status: true, checkCount, addedCount, updatedCount };
          }
        } else {
          // update here if needed
          let lead = {
            accountId: project.lead.accountId,
            displayName: project.lead.displayName,
          };
          let manager = {
            accountId: "",
            displayName: "",
          };

          let treks = PROJECTSTREK.filter((p) => +p === +newProject.projectId);
          let activeResources = treks.length;
          console.log("Updating", newProject.projectId, activeResources);

          let managerExist = false;
          if (managerExist) {
            // fill manager details
          }

          const resultUpdateDB_PROJECTS = await myDB
            .collection(DB_PROJECTS)
            .updateOne(
              { projectId: newProject.projectId },
              {
                $set: {
                  // projectId:project.id,
                  self: newProject.self,
                  key: newProject.key,
                  projectTypeKey: newProject.projectTypeKey,
                  name: newProject.name,
                  isPrivate: newProject.isPrivate,
                  simplified: newProject.simplified,
                  style: newProject.style,
                  insight: newProject.insight,
                  properties: newProject.properties,
                  avatarUrl: newProject.avatarUrls,
                  projectCategory: newProject.projectCategory,
                  lead,
                  manager,
                  activeResources,
                  listDepartment: listDepartment,

                  description: newProject.description || "",
                  SOW: newProject.SOW,
                  Billable: newProject.Billable,

                  updated: timestamp,
                  updWOW: currentDate,
                },
              }
            );

          checkCount++;
          updatedCount++;

          const resultCreateDB_OVERVIEW = await myDB
            .collection(DB_PROJECTOVERVIEW)
            .updateOne(
              { projectId: project.id },
              {
                $set: {
                  // projectId: project.id,
                  // key:newProject.key,
                  name: newProject.name,

                  // boards:[],
                  // actors:[],

                  updated: currentDate,
                },
              }
            );

          if (projects.length == i + 1) {
            const updateProject = await myDB
              .collection(DB_ONBOARDING)
              .updateOne(
                { tag: DB_ONBOARDING_DOC_PROJECTS },
                {
                  $set: {
                    projectList: projectList,
                    updated: {
                      via: via,
                      now: timestamp,
                      wow: currentDate,
                    },
                  },
                }
              );

            const resultUpdateDB_DEPARTMENTS = await myDB
              .collection(DB_ONBOARDING)
              .updateOne(
                { tag: DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE },
                {
                  $set: {
                    totalProjects: projects.length,
                    updated: currentDate,
                  },
                }
              );

            return {
              status: true,
              checkCount,
              addedCount,
              updatedCount,
              // projects
            };
          }
        }
      }

      // }
    }
  },
};
