/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an HTTP starter function.
 * 
 * Before running this sample, please:
 * - create a Durable activity function (default name is "Hello")
 * - create a Durable HTTP starter function
 * - run 'npm install durable-functions' from the wwwroot folder of your 
 *    function app in Kudu
 */

const df = require("durable-functions");


/*
function parseUrlEncodedData(data) {
    if(!data){
        return {type:null}
    }else{
    const keyValuePairs = data.split('&');
    const parsedData = {};

    keyValuePairs.forEach(pair => {
        const [key, value] = pair.split('=');
        parsedData[key] = value;
    });

    return parsedData;
    }
}
*/
module.exports = df.orchestrator(function* (context) {
    const outputs = [];
    // const parsedBody = context.bindingData.input;

    if(!context.bindingData.input){
        console.log("NO INPUTS FOUND")
        return outputs;

    }else{
        // console.log("input", context.bindingData.input)
    // const parsedBody = parseUrlEncodedData(context.bindingData.input);
    const parsedBody = context.bindingData.input;
    // console.log({success:true, parsedBody:parsedBody, input:context.bindingData.input })

    if(
        parsedBody.type == 'USERS' ||
        parsedBody.type == 'BOARDS' ||
        parsedBody.type == 'SPRINTS' ||
        parsedBody.type == 'PROJECTS' ||
        parsedBody.type == 'ISSUES50' ||
        parsedBody.type == 'ISSUES1000' ||
        parsedBody.type == 'ISSUES5000' ||
        parsedBody.type == 'WORKLOGS' ||

        parsedBody.type == 'DEPARTMENTS' ||
        parsedBody.type == 'SKILLS' ||
        parsedBody.type == 'CERTS' ||
        parsedBody.type == 'CAPACITIES' ||
        
    false){
        outputs.push(yield context.df.callActivity("DurableFunctionsActivity", ({
            type:'XM-' + parsedBody.type
        })));
        return outputs;
    }else{
        return outputs;
    }

    }
    
});