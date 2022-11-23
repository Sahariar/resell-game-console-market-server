const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 4000
 
// middleware
app.use(cors());
app.use(express.json());
 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@resell-game-console-mar.8cywhdv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log(process.env.DB_USER, process.env.DB_PASSWORD);


const run = async () => {
}
run().catch(console.dir); 
 
 
app.get('/' , (req ,res) =>{
res.send('server is running');
})
 
app.listen(port, ()=>{
console.log(`Server is running at ${port}`);
})
