module.exports.isPROD = "DEV"; // for localhost="" / "DEV" / "PROD"
module.exports.isProdBackeURL = "";
module.exports.isDevBackeURL =
  "https://ceq-xpertise-manager-dev-job.azurewebsites.net";
module.exports.isLocalBackeURL = "http://localhost:7071";

// Microsoft
module.exports.TENANT_ID = "dbd61555-f8c0-4db8-83e3-d55f7565507d";
module.exports.CLIENT_ID = "a15d85e6-0750-4b45-aa79-3fae4e4b425d";
module.exports.CLIENT_SECRET = "1Hw8Q~0MkLlTnMRDBc4meI47ztM7tQyUfH0mBcqQ";
module.exports.GRAPH_ENDPOINT = "graph.microsoft.com/";
module.exports.AAD_ENDPOINT = "login.microsoftonline.com/";

// MongoDB
module.exports.MongoDB =
  "mongodb+srv://xpertiseAdmin:Admin%40admin%234@ceqxpertiseproddb.hqawqpf.mongodb.net/?retryWrites=true&w=majority";
// module.exports.MongoDB = "mongodb://localhost:27017/";
module.exports.useDB_PROD = "XM-PROD";

module.exports.DB_ONBOARDING = "xm_onboardings";
module.exports.DB_ONBOARDING_DOC_USERS = "ONBOARDING_USERS";
module.exports.DB_ONBOARDING_DOC_BOARDS = "ONBOARDING_BOARDS";
module.exports.DB_ONBOARDING_DOC_PROJECTS = "ONBOARDING_PROJECTS";
module.exports.DB_ONBOARDING_DOC_SKILLS = "ONBOARDING_SKILLS";
module.exports.DB_ONBOARDING_DOC_CERTIFICATES = "ONBOARDING_CERTIFICATES";
module.exports.DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW =
  "PRECALCULATED_DepartmentView";
module.exports.DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_LITE =
  "CALCULATED_LITE";
module.exports.DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_KNOW =
  "CALCULATED_KNOW";
module.exports.DB_ONBOARDING_DOC_REPORTS_DEPARTMENTVIEW_ACTIVE =
  "CALCULATED_ACTIVE";

// focus on data query as per ui/ux
module.exports.DB_USERS = "xm_users";
module.exports.DB_BOARDS = "xm_boards";
module.exports.DB_SPRINTS = "xm_sprints";
module.exports.DB_PROJECTS = "xm_projects";
module.exports.DB_ISSUES = "xm_issues";
module.exports.DB_TIMETRACKING = "xm_trackers";
module.exports.DB_USER_WORKLOGS = "xm_user_worklogs";
module.exports.DB_LOCALPROJECT = "xm_local_projects";
module.exports.DB_PROJECTOVERVIEW = "xm_project_stats";
module.exports.DB_SAVED_PROJECTS = "xm_saved_reports";
// module.exports.DB_ISSUE_WORKLOGS = "xm_issue_worklogs"// dependent on issue logs based on assigned user
// module.exports.DB_BOARD_WORKLOGS = "xm_board_worklogs" // dependent on issue logs based on assigned board
// module.exports.DB_PROJECT_WORKLOGS = "xm_project_worklogs" // dependent on issue logs based on assigned project

// Atlasian
module.exports.JIRA_DOMAIN_URL = "cloudeq.atlassian.net/";
module.exports.SECURITY_TOKEN =
  "tempoautomation@cloudeq.com:ATATT3xFfGF0ZqBPyCckFdQ63v3EDBEykig6DtRYUOs4WicSRHRIseItitpfYS8ub6BnKUQOtFh8zPG-sRAoHVGi7S_KrglrHpU4DzeI6XGgQAjNhN5ls4B1zHtCEmuA3b-lpXHuGnAvnEZFDUcUaotsxyan-F3F5sWPsCmxElUunH7K_25_bPo=0F73B4D7";

// Atlasian MCD
module.exports.JIRA_DOMAIN_URL_MCD = "cloudeq.atlassian.net/";
module.exports.SECURITY_TOKEN_MCD =
  "tempoautomation@cloudeq.com:ATATT3xFfGF0ZqBPyCckFdQ63v3EDBEykig6DtRYUOs4WicSRHRIseItitpfYS8ub6BnKUQOtFh8zPG-sRAoHVGi7S_KrglrHpU4DzeI6XGgQAjNhN5ls4B1zHtCEmuA3b-lpXHuGnAvnEZFDUcUaotsxyan-F3F5sWPsCmxElUunH7K_25_bPo=0F73B4D7";

module.exports.KEYS = [
  // change this every month
  "1234567890", // orignal
];

module.exports.mailCreds = {
  name: "xm support",
  email: "xm.support@cloudeq.com",
  password: "B@556594202246uw",
};
