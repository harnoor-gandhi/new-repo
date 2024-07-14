const express = require("express");
const cors = require('cors')
const mongoose = require("mongoose");

const testRouter1 = require('./test1');
const testRouter2 = require('./test2');

const {
  MongoDB, 
  useDB_PROD,
  DB_ONBOARDING,
  DB_ONBOARDING_DOC_USERS, DB_ISSUES, 
} = require('./credsStore');


const backendApi = express();
backendApi.use(cors());
backendApi.use(express.json());


mongoose.connect(MongoDB, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongoose connection error:'));
db.once('open', () => { console.log('Mongoose connected!'); });

backendApi.get('/api/v2/test',async (req, res) => {
    res.json({success:true})
}) // test route

backendApi.use('/api/v2/testbed1',testRouter1) // next version
backendApi.use('/api/v2/testbed2',testRouter2) // next version



const port = process.env.PORT || 3000;
backendApi.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

module.exports = backendApi;