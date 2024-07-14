
const myDB = mongoose.connection.useDb(useDB_PROD);

async function postFailureAgent(where, err){
    const errors = {
        where,
        err,
        agent:"FAILURE"
    }

    const failedPost = await myDB.collection("xm_logger").insertOne({ errors });
    return {success: true, info:"Posted Failure"};
}

async function postSuccessAgent(where, process){
    const errors = {
        where,
        process,
        agent:"SUCCESS"
    }

    const successPost = await myDB.collection("xm_logger").insertOne({ errors });
    return {success: true, info:"Posted Success"};
}

module.exports = {postFailureAgent}