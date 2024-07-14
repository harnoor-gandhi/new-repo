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
  DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE,
  // ProdDB, CLOUD_INSTANCE
} = require("./../backendHttpTrigger/credsStore");

module.exports = {
  onBoardUsers: async function (via) {
    let maxCount = 50; // there is a limit min 1 & 999 max
    const myDB = mongoose.connection.useDb(useDB_PROD);

    // console.log({success:true, via:via})
    if (via !== "CREATED" && via !== "MANUALY" && via !== "SCHEDULED") {
      return {
        status: false,
        err: "You don't know what your doing, please consider proper training!",
      };
    } else {
      // get everyone from microsoft
      try {
        const tknRes = await axios.post(
          `https://${AAD_ENDPOINT}${TENANT_ID}/oauth2/v2.0/token`,
          `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=https://graph.microsoft.com/.default`
        );

        // Fetch all users from Microsoft Graph API using the obtained access token
        let response = await axios.get(
          `https://${GRAPH_ENDPOINT}v1.0/users?$top=${maxCount}&$select=id,accountEnabled,displayName,city,companyName,country,department,createdDateTime,employeeId,givenName,isResourceAccount,jobTitle,identities,officeLocation,mail,mobilePhone&$expand=manager($levels=max;$select=id,displayName,jobTitle,mail)`,
          {
            headers: { Authorization: `Bearer ${tknRes.data.access_token}` },
          }
        );
        let responseX;
        let countSpins = 0;
        let resCounts = [];

        let skipToken = response.data["@odata.nextLink"];
        while (skipToken) {
          countSpins++;

          if (skipToken) {
            responseX = await axios.get(`${skipToken}`, {
              headers: { Authorization: `Bearer ${tknRes.data.access_token}` },
            });
            response.data.value.push(...responseX.data.value);
            resCounts.push(responseX.data.value.length);
            skipToken = responseX.data["@odata.nextLink"];

            console.log(responseX.data.value.length, countSpins);
          } else {
            console.log("finish countSpins", countSpins);
          }
        }

        if (response.data.value.length >= 999) {
          // incase users are more than 999 we need to rotate there
          return {
            status: false,
            err: "users have expanded beyond 999, please upgrade code!",
          };
        } else {
          let ignoreList = [
            "administration20@cloudeq.com",
            "administration18@cloudeq.com",
            "administration19@cloudeq.com",
            "administration7@cloudeq.com",
            "administration5@cloudeq.com",

            "user.test@cloudeq.com",
            "user.test@cloudeq.com",
            "user.test1@cloudeq.com",
            "user1.test@cloudeq.com",
            "test.test1@cloudeq.com",

            "test.paylocity@cloudeq.com",
            "payroll.test@cloudeq.com",
            "ab.ab@cloudeq.com",
          ];
          // for now this will work

          // get onboarding list on MongoDB
          // console.log("Han",  response.data.value.filter(o => o.mail == 'irvin.arias@cloudeq.com'))
          let w = response.data.value
            .filter(
              (o) =>
                !o.employeeId &&
                o.isResourceAccount == null &&
                o.mail &&
                o.mail.includes("@cloudeq.com")
            )
            .map((o) => {
              return { mail: o.mail, employeeId: o.employeeId };
            });
          // console.log("Han",  w)

          const NowMS_UserList = response.data.value.filter(
            (o) =>
              o.mail &&
              o.mail.includes("@cloudeq.com") &&
              o.employeeId &&
              o.employeeId?.trim()?.length > 0 &&
              o.accountEnabled &&
              !ignoreList.includes(o.mail)
          );
          // const NowMS_UserListRemove = response.data.value.filter(o => o.mail && o.mail.includes('@cloudeq.com') && o.employeeId && (o.employeeId.trim().length !== 0) && !o.accountEnabled )
          const NowMS_UserEmailList = NowMS_UserList.map((e) =>
            e.mail.toLowerCase()
          );
          // const NowMS_UserEmailListRemove = NowMS_UserListRemove.map(e => e.mail.toLowerCase());
          const NowMS_UserListIDS = NowMS_UserList.map((e) => e.id);

          const ONBOARDING_USERS = await myDB
            .collection(DB_ONBOARDING)
            .findOne({ tag: DB_ONBOARDING_DOC_USERS });
          const OldMS_UserEmailList =
            JSON.parse(JSON.stringify(ONBOARDING_USERS)).users || [];
          const jiraUIDS =
            JSON.parse(JSON.stringify(ONBOARDING_USERS)).jiraUIDS || [];
          let checkCount = 1;
          let addedCount = 1;
          let updatedCount = 1;

          let z = OldMS_UserEmailList.filter(
            (a) => !NowMS_UserEmailList.includes(a)
          ).map((a) => {
            return {
              email: a,
              jiraID: jiraUIDS[OldMS_UserEmailList.indexOf(a)],
            };
          });
          // console.log("Statagic Misshab:", response.data.value.length, z)
          console.log(
            "total",
            countSpins,
            resCounts,
            response.data.value.length,
            NowMS_UserList.length
          );

          // return response.data.value

          let departments = [];
          let departmentCount = {};
          let jobTitle = [];

          for (let i = 0; i < NowMS_UserList.length; i++) {
            const userNowMS = NowMS_UserList[i];
            let timestamp = Date.now();
            const currentDate = new Date(timestamp);

            // check if dont exist create & add to list or update with current ms then jira
            if (
              !OldMS_UserEmailList.includes(userNowMS.mail.toLowerCase()) &&
              !ignoreList.includes(userNowMS.mail.toLowerCase())
            ) {
              // create mongodb here

              try {
                const responseJIRA = await axios.get(
                  `https://${JIRA_DOMAIN_URL}rest/api/3/user/search?query=` +
                    userNowMS.mail.toLowerCase(),
                  {
                    headers: {
                      Accept: "application/json",
                      Authorization: `Basic ${Buffer.from(
                        `${SECURITY_TOKEN}`
                      ).toString("base64")}`,
                    },
                  }
                );

                // if(!responseJIRA.data[0]){
                //     console.log(userNowMS,responseJIRA.data)
                // }

                let newUser = {
                  UID: "",
                  EID: userNowMS.employeeId,
                  TYP: ["USER"],
                  email: userNowMS.mail.toLowerCase(),
                  name: userNowMS.displayName,
                  azureUser: userNowMS,
                  jiraUser: responseJIRA.data[0] || {},
                  hrUser: {},
                  access: [],
                  skills: [],
                  certify: [],
                  updated: timestamp,
                  created: timestamp,
                  projectIDZ: {
                    timeSpent1: 0,
                    timeSpent2: 0,
                    timeSpent3: 0,
                    MonthMinus0: [],
                    MonthMinus1: [],
                    MonthMinus2: [],
                  },
                  issueIDZ: {
                    timeSpent1: 0,
                    timeSpent2: 0,
                    timeSpent3: 0,
                    MonthMinus0: [],
                    MonthMinus1: [],
                    MonthMinus2: [],
                  },
                  updWOW: currentDate,
                  creWOW: currentDate,
                };

                if (
                  !responseJIRA.data ||
                  !responseJIRA.data[0] ||
                  !responseJIRA.data[0].accountId
                ) {
                  console.log("INVALID USER");
                } else {
                  if (newUser.jiraUser && newUser.jiraUser.avatarUrls) {
                    newUser.jiraUser.avatarUrls =
                      newUser.jiraUser.avatarUrls["24x24"];
                  }

                  const resultDB_USERS = await myDB
                    .collection(DB_USERS)
                    .insertOne(newUser);

                  const resultUpdateDB_USERS = await myDB
                    .collection(DB_USERS)
                    .updateOne(
                      { _id: resultDB_USERS.insertedId },
                      {
                        $set: {
                          UID: new ObjectId(
                            resultDB_USERS.insertedId
                          ).valueOf(),
                        },
                      }
                    );

                  const createMyIssue = await myDB
                    .collection(DB_ISSUES)
                    .insertOne({
                      jiraID: responseJIRA.data[0]?.accountId,
                      email: newUser.email,
                      issues: [],
                      department: newUser.azureUser.department,
                    });
                  const createMyIssueWorklog = await myDB
                    .collection(DB_USER_WORKLOGS)
                    .insertOne({
                      jiraID: responseJIRA.data[0]?.accountId,
                      email: newUser.email,
                      worklogs: [],
                    });

                  const updateUser = await myDB
                    .collection(DB_ONBOARDING)
                    .updateOne(
                      { tag: DB_ONBOARDING_DOC_USERS },
                      {
                        $push: {
                          users: userNowMS.mail.toLowerCase(),
                          jiraUIDS: responseJIRA.data[0]?.accountId || null,
                          // microsoftUIDS: userNowMS.id,
                          // jiraFails: !responseJIRA.data[0] ? userNowMS : undefined
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

                  console.log("CREATED USERS");
                }

                checkCount;
                addedCount;

                if (NowMS_UserList.length == i + 1) {
                  return { status: true, checkCount, addedCount, updatedCount };
                }
              } catch (er) {
                console.log("errr", er);
              }

              console.log("created", userNowMS.employeeId);
            } else {
              if (!ignoreList.includes(userNowMS.mail.toLowerCase())) {
                if (
                  userNowMS.department &&
                  !departments.includes(userNowMS.department)
                ) {
                  if (userNowMS.department == "LEAD SOFTWARE ENGINEER") {
                    console.log(userNowMS);
                  }
                  departments.push(userNowMS.department);
                }

                if (
                  !departmentCount[
                    userNowMS.department
                      ? userNowMS.department.trim()
                      : "Highfield"
                  ]
                ) {
                  departmentCount[
                    userNowMS.department
                      ? userNowMS.department.trim()
                      : "Highfield"
                  ] = 0;
                }
                departmentCount[
                  userNowMS.department
                    ? userNowMS.department.trim()
                    : "Highfield"
                ] += 1;

                // if(userNowMS.department?.includes("Sales")){
                //     console.log(userNowMS)
                // }

                // if(userNowMS.mail == "dipesh.bhoir@cloudeq.com"){
                //     console.log(userNowMS)
                // }

                if (
                  userNowMS.jobTitle &&
                  !jobTitle.includes(userNowMS.jobTitle)
                ) {
                  jobTitle.push(userNowMS.jobTitle);
                }
                // update here if needed
                // console.log("m", userNowMS.manager)
                if (!userNowMS.manager) {
                  console.log("No Manager", userNowMS.email);
                }
                const resultUpdateDB_USERS = await myDB
                  .collection(DB_USERS)
                  .updateOne(
                    { email: userNowMS.mail.toLowerCase() },
                    {
                      $set: {
                        EID: userNowMS.employeeId,
                        ["azureUser.department"]:
                          userNowMS.department?.trim() || "Highfield",
                        ["azureUser.jobTitle"]: userNowMS.jobTitle?.trim(),
                        ["azureUser.accountEnabled"]: userNowMS.accountEnabled,
                        ["azureUser.manager"]: {
                          name: userNowMS.manager?.displayName || "",
                          mail: userNowMS.manager?.mail?.toLowerCase() || "",
                          jobTitle: userNowMS.manager?.jobTitle || "",
                          id: userNowMS.manager?.id || "",
                        },
                      },
                    }
                  );

                checkCount;
                updatedCount;

                // const responseJIRA = await axios.get(`https://${JIRA_DOMAIN_URL}rest/api/3/user/search?query=` + userNowMS.mail.toLowerCase(), {
                //     headers: {
                //         'Accept': 'application/json',
                //         'Authorization': `Basic ${Buffer.from(`${SECURITY_TOKEN}`).toString('base64')}`
                //     }
                // })

                // if( responseJIRA.data[0] && responseJIRA.data[0].accountId ){

                // }
                console.log("Updated", userNowMS.employeeId);

                if (NowMS_UserList.length == i + 1) {
                  departments.push("Highfield");

                  const updateUser = await myDB
                    .collection(DB_ONBOARDING)
                    .updateOne(
                      { tag: DB_ONBOARDING_DOC_USERS },
                      {
                        // $unset: {
                        // },
                        // $push: {
                        // },
                        $set: {
                          // jiraUIDS: jiraListUIDS,
                          microsoftUIDS: NowMS_UserListIDS,
                          // jiraFails: jiraAcList,
                          updated: {
                            via: via,
                            now: timestamp,
                            wow: currentDate,
                          },
                        },
                      }
                    );
                  let t = {
                    allDepartments: departments.map((q) => q.trim()),
                    jobTitles: jobTitle.map((q) => q.trim()),
                    totalResources: NowMS_UserList.length,
                    updated: currentDate,
                  };

                  await t.allDepartments.map((dpt) => {
                    let n = dpt
                      .toLowerCase()
                      .split(" ")
                      .join("_")
                      .split("&")
                      .join("and");
                    t[`resourceDepartments.departmentTotal_${n}`] =
                      departmentCount[dpt] || 0;
                  });

                  // store departments
                  const resultUpdateDB_DEPARTMENTS = await myDB
                    .collection(DB_ONBOARDING)
                    .updateOne(
                      { tag: DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE },
                      { $set: t }
                    );

                  return {
                    status: true,
                    w,
                    checkCount,
                    addedCount,
                    updatedCount,
                  };
                }
              } else {
                checkCount++;
                console.log("ignored ", userNowMS.employeeId, userNowMS.mail);
                if (NowMS_UserList.length == i + 1) {
                  return {
                    status: true,
                    checkCount,
                    addedCount,
                    updatedCount,
                    data: response.data,
                  };
                }
              }
            }
          }

          // return ( OldMS_UserEmailList )
        }

        // Return the list of users in the response
        // return ({s:'success', data: response.data.value.filter(o => o.mail && o.mail.includes('@cloudeq.com') ).map(e => e.mail) });
      } catch (error) {
        console.error(
          "Error fetching users:",
          error.response?.data || error.message
        );
        // res.status(500).json({ error: 'There was an issue getting current users from Microsoft.' });
        return {
          mes: "There was an issue getting current users from Microsoft.",
          error,
        };
      }
    }
  },
};
