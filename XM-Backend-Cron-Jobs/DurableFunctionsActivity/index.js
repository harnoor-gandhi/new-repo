/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 * 
 * Before running this sample, please:
 * - create a Durable orchestration function
 * - create a Durable HTTP starter function
 * - run 'npm install durable-functions' from the wwwroot folder of your
 *   function app in Kudu
 */

const users = require('../services/onboard_users');
const boards = require('../services/onboard_boards');
const sprints = require('../services/onboard_sprints');
const projects = require('../services/onboard_projects');
const issuePiranhas = require('../services/onboard_issuePiranhas');
const issueTurtles = require('../services/onboard_issueTurtles');
const issueWhales = require('../services/onboard_issueWhales');
const worklogs = require('../services/onboard_worklogs');

const departments = require('../services/sync_departments');
const skills = require('../services/sync_skills');
const certs = require('../services/sync_certs');
const capacities = require('../services/sync_capacity');


module.exports = async function (context) {
    // return `Hello ${context.bindings.name}!`;
    // const result = await service.greet(context.bindings.name)
    
        const binder = context.bindings.name;
        const type = binder.type;
        const when = +binder.type;
        const via = "SCHEDULED";
        // const jiraID = "641992310e6828ab2025df10";

    if(!type){
        console.log('No Type Found')
        return null
    }else{
        // console.log('Type Found in Activity')
        if(
            type == 'XM-USERS' ||
            type == 'XM-BOARDS' ||
            type == 'XM-SPRINTS' ||
            type == 'XM-PROJECTS' ||
            type == 'XM-ISSUES50' ||
            type == 'XM-ISSUES1000' ||
            type == 'XM-ISSUES5000' ||
            type == 'XM-WORKLOGS' ||
            type == 'XM-DEPARTMENTS' ||
            type == 'XM-SKILLS' ||
            type == 'XM-CERTS' ||
            type == 'XM-CAPACITIES' ||
        false){
            if(type == 'XM-USERS'){
                const result = await users.onBoardUsers(via)
                return result;
            }
            if(type == 'XM-BOARDS'){
                const result = await boards.onboardJiraBoards(via)
                return result;
            }
            if(type == 'XM-SPRINTS'){
                const result = await sprints.onboardJiraSprints(via)
                return result;
            }
            if(type == 'XM-PROJECTS'){
                const result = await projects.onboardJiraProjects(via)
                return result;
            }
            if(type == 'XM-ISSUES50'){
                const result = await issuePiranhas.onboardJiraIssues(via)
                return result;
            }
            if(type == 'XM-ISSUES1000'){
                const result = await issueTurtles.onboardJiraIssues(via)
                return result;
            }
            if(type == 'XM-ISSUES5000'){
                const result = await issueWhales.onboardJiraIssues(via)
                return result;
            }
            if(type == 'XM-WORKLOGS'){
                const result = await worklogs.onboardJiraWorklogs(via)
                return result;
            }
            if(type == 'XM-DEPARTMENTS'){
                const result = await departments.onBoardDepartments(via)
                return result;
            }
            if(type == 'XM-SKILLS'){
                const result = await skills.onBoardSkills(via)
                return result;
            }
            if(type == 'XM-CERTS'){
                const result = await certs.onBoardCerts(via)
                return result;
            }
            if(type == 'XM-CAPACITIES'){
                const result = await capacities.onBoardCapacities(via)
                return result;
            }
        }else{
            return {context:context.bindings.name, state:null}
        }
    }

};