
const df = require("durable-functions");

module.exports = async function (context, req) {
    // console.log('HIT', context.query )
    const client = df.getClient(context);
    const instanceId = await client.startNew("FunctionsOrchestrator", undefined, req.query)

    context.log(`Started orchestration with ID = '${instanceId}'.` );

    const x = await client.createCheckStatusResponse(context.bindingData.req, instanceId);


    return context.res = {
        status: 200, // Status code 200 indicates success
        headers: {
            "Content-Type": "application/json", // Set the Content-Type header to indicate JSON response
        },
        body: {success:true, status:x}, // JSON object as the response body
    };
}