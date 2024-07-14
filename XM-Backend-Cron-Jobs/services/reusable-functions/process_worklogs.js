const axios = require("axios");

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
} = require("./../../backendHttpTrigger/credsStore");

async function get5000WorklogsApi(key, startAt, maxResults) {
  // const response = await axios.get(`https://${JIRA_DOMAIN_URL}rest/api/3/issue/${key}/worklog?startAt=${startAt}&maxResults=${maxResults}&orderBy=+started`, { //
  const response = await axios.get(
    `https://${JIRA_DOMAIN_URL}rest/api/3/issue/${key}/worklog?startAt=${startAt}&maxResults=${maxResults}&orderBy=+started`,
    {
      //
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

async function getAllMyWorklogs(jiraID, issueKey, when) {
  let $worklogs = [];

  let startAt = 0;
  let maxResults = 5000;
  // let total = 1;

  // let extraLoopCondition = false
  // while (total > 0 && !extraLoopCondition) {
  //     if( total <= 0 ){
  //         extraLoopCondition = true;
  //         console.log("WHILE JIRA FETCH IS OVER")
  //         // break;
  //     }else{

  try {
    const data = await get5000WorklogsApi(issueKey, startAt, maxResults);
    console.log(
      "WORKLOGS",
      issueKey,
      data.total,
      data.worklogs.map((worklog) => worklog.timeSpentSeconds),
      data.worklogs.map((worklog) => {
        let fx = new Date(worklog.started)
        return fx.getDate() +'-'+ fx.getMonth()
      }
    ),
    //   data.worklogs.map((worklog) => {
    //     let fx = new Date(worklog.updated)
    //     return fx.getDate() +'-'+ fx.getMonth()
    //   }
    // )
    );

    // if(startAt == 0){
    //     total = data.total;

    //     // update he has no worklogs
    //     if(total == 0){
    //         console.log("NO WORKLOGS")
    //     }
    // }

    // total -=  total - (total < data.worklogs.length ? total : data.worklogs.length);
    startAt += maxResults;

    $worklogs.push(
      ...data.worklogs.map((worklog) => {
        return {
          created: new Date(worklog.created),
          updated: new Date(worklog.updated),
          started: new Date(worklog.started),
          timeSpent: worklog.timeSpent,
          timeSeconds: worklog.timeSpentSeconds,
          id: worklog.id,
          issueId: worklog.issueId,
          issueKey,
        };
      })
    );

    // if($worklogs.length > data.total){
    // $worklogs = [...new Map($worklogs.map(item => [item.key, item])).values()];
    // console.log('loka', $worklogs.map(k => k.key))
    // }
  } catch (err) {
    if (err.response?.status == 404) {
      console.log("WHILE WORKLOGS AXIOS FAILED > ISSUE DELETED");
    } else {
      console.log("WHILE WORKLOGS AXIOS FAILED > UNKNOWN");
    }
    // break;
  }
  // }

  // }

  // console.log("ALL WORKLOGS", $worklogs.length)
  return $worklogs;
}

async function getProcessedTeamsApi(
  emailId,
  tknRes,
  GetWantFinishMonth0,
  GetWantStartMonth0,
  GetWantFinishMonth1,
  GetWantStartMonth1,
  GetWantFinishMonth2,
  GetWantStartMonth2
) {
  // Fetch all users from Microsoft Graph API using the obtained access token
  // const query = `/auditLogs/signIns?filter=activityDateTime ge ${firstDayOfMonth.toISOString()} and activityDateTime le ${lastDayOfMonth.toISOString()}`;
  let responseTeams = await axios.get(
      `https://${GRAPH_ENDPOINT}v1.0/users/${emailId}/calendar/calendarView?$top=${500}&startDateTime=${GetWantStartMonth0.toISOString()}&endDateTime=${GetWantFinishMonth0.toISOString()}`,
      {
        // &$select=id,accountEnabled,displayName,city,companyName,country,department,createdDateTime,employeeId,givenName,isResourceAccount,jobTitle,identities,officeLocation,mail,mobilePhone
        headers: { Authorization: `Bearer ${tknRes.data.access_token}` },
      }
    )
    .then((d) => {
      console.log("Fetch Success", emailId);
      return {
        data: {
          value: d.data.value,
          error: null,
        },
      };
    })
    .catch((e) => {
      console.log(
        "Fetch Failed",
        emailId,
        e.response
        // e.response?.data?.error
      );
      return {
        data: {
          value: null,
          error: e.response?.data?.error,
        },
      };
    });

  if (
    responseTeams &&
    responseTeams.data &&
    !responseTeams.data.error &&
    responseTeams.data.value
  ) {
    responseTeams = await responseTeams.data.value.map((e) => {
      return {
        title: e.subject,
        //   description: e.bodyPreview,
        start: e.start.dateTime,
        end: e.end.dateTime,
        date: new Date(e.start.dateTime).getDate(),
        month: new Date(e.start.dateTime).getMonth(),
        timeSeconds: getSecondsBetweenDates(e.start.dateTime, e.end.dateTime),
      };
    });

    let responseTeams0 =
      responseTeams.filter(
        (d) =>
          new Date(d.start) >= new Date(GetWantStartMonth0) &&
          new Date(d.end) <= new Date(GetWantFinishMonth0)
      ) || [];
    let responseTeams1 =
      responseTeams.filter(
        (d) =>
          new Date(d.start) >= new Date(GetWantStartMonth1) &&
          new Date(d.end) <= new Date(GetWantFinishMonth1)
      ) || [];
    let responseTeams2 =
      responseTeams.filter(
        (d) =>
          new Date(d.start) >= new Date(GetWantStartMonth2) &&
          new Date(d.end) <= new Date(GetWantFinishMonth2)
      ) || [];

    console.log(
      "responseTeams",
      responseTeams.length,
      responseTeams0.length,
      responseTeams1.length,
      responseTeams2.length
    );

    return {
      responseTeams0,
      // responseTeams1,
      // responseTeams2
    };
  } else {
    // console.log("I AM HERE", responseTeams.data.error)

    return {
      responseTeams0: [],
      responseTeams1: [],
      responseTeams2: [],
      suspended: true,
    };
  }
}

function getSecondsBetweenDates(date1, date2) {
  // Convert both dates to milliseconds
  var date1_ms = new Date(date1).getTime();
  var date2_ms = new Date(date2).getTime();

  // Calculate the difference in milliseconds
  var difference_ms = Math.abs(date2_ms - date1_ms);

  // Convert milliseconds to seconds
  var difference_sec = Math.floor(difference_ms / 1000);

  return difference_sec;
}

async function getProcessedWorklogsApi(jiraID, issueList, when) {
  let worklogs = [];

  for (let k = 0; k < issueList.length; k++) {
    const issueKey = issueList[k];

    const work = await getAllMyWorklogs(jiraID, issueKey, when);
    worklogs.push(...work);

    if (issueList.length == k + 1) {
      // console.log("Happy", worklogs.length)
      return worklogs;
    }
  }
}

module.exports = { getProcessedWorklogsApi, getProcessedTeamsApi };
