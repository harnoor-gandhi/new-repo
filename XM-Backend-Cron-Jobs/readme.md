## Resource Manager - Backend

| Project | Package | Version | Links |
|---|---|---|---|
| PROD | axios | ^1.6.8 | URL |
| PROD | azure-function-express | ^2.0.0" | URL |
| PROD | cors | ^2.8.5 | URL |
| PROD | durable-functions | ^2.1.3 | URL |
| PROD | express | ^4.18.3 | URL |
| PROD | mongoose | ^8.2.2 | URL |
| PROD | uuid | ^9.0.1 | URL |
| DEV | azure-functions-core-tools | ^4.x | URL |
| DEV | nodemon | ^3.1.0 | URL |


<hr>


<details>
<summary>Click to Expand = Domains & Enviroments</summary>

LOCAL Enviroment
> http://localhost:7071

DEV Enviroment
> https://ceq-xpertise-manager-dev.azurewebsites.net

STG Enviroment
> UNKNOWN

PROD Enviroment
> UNCLEAR

</details>

<details>
<summary>Click to Expand = Central dependencies</summary>

- backendHttpTrigger
    - credsStore.js
    - universal.model.js

</details>

<details>
<summary>Click to Expand = Scheduler Functions</summary>

- DurableFunctionsActivity > Services
- FunctionsOrchestrator > FunctionsOrchestrator
- HttpTriggerOrchestrator > FunctionsOrchestrator

- scheduleUsers > HttpTriggerOrchestrator
- scheduleProjects > HttpTriggerOrchestrator
- scheduleBoards > HttpTriggerOrchestrator

- schedule_issuePiranhas > HttpTriggerOrchestrator
- schedule_issueTurtles > HttpTriggerOrchestrator
- schedule_issueWhales > HttpTriggerOrchestrator

- scheduleWorklogs > HttpTriggerOrchestrator

- scheduleDepartments > HttpTriggerOrchestrator
- scheduleSkills > HttpTriggerOrchestrator

- Services > reusable-functions

</details>


<hr>


## backendHttpTrigger > apis

> 2 | /page_users
- /get-user/:via "REUSABLE API"
- /all-users/:via "REUSABLE API"

> 4 | /page_skills
- /user/skills-updater/:via
- /user/certify-updater/:via
- /onboarding/getAllSkills/:via
- /onboarding/add-skill/:via

> 5 | /page_reports
- /reports/user/:email/:period
- /reports/users/:page/:period
- /report/departments/:page
- /report/department/:name/:page
- /report/department-projects/:name/:page
- /vertical-resource/:via
- /skill-detail/:via

> 2 | /page_tracker
- /add-manualWorklog/:via
- /timetracking/:via

> 3 | /page_projects
- /list-projects/:via

> 0 | /page_boards 
- api1

> 0 | /page_dashboard
- api1

> 0 | /page_issues 
- api1

> 0 | /page_schedule
- api1

<hr>

Limitations Discovery
- Jira 429 Error 10 calls/second
- Azure HttpTrigger Functions 2 minute max Timeout
- Azure Durable Functions 5 minute max Timeout
- Azure Test Server 30 minute max Timeout
- Azure Outlook User Api can fail with 429
- Azure Outlook Calander Api can fail with 429

Policy
- Max REST api load time < 3 seconds
- Refresh scope 24h to 7 days based on necessity
- Maintain minimum data in MongoDB & archive for utility
- Automate junk Detection and flush it out
- No place for unused routes
- Every route must have KEY
- use UID for to modify anything and never expose it
- Avoid Dta replication with quality design


### Start Backend
```npm run serve```

### Start Functions
```npm run start```

### Deploy
```func azure functionapp publish ceq-xpertise-manager-dev-job```

[Wednesday 18:52] KARANDEEP SINGH
ceq-xpertise-manager-dev-job
Microsoft Azure
