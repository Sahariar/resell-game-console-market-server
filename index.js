const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

    const productCollection = client.db('rgc-db').collection('products');
    const productCatCollection = client.db('rgc-db').collection('pdctCategory');
    const usersCollection = client.db('rgc-db').collection('users');


    //get products 
    app.get('/products' , async(req ,res) =>{
        const email = req.query.email
        const category = req.query.category

        let query ={

        }
        if(email){
            query ={
                email:email
            }
        }else if(category){
            query ={
                category:category
            }
        }

        const result = await productCollection.find(query).toArray();
        res.send(result)
    })

    //get products category
    app.get('/products/category' , async(req ,res) =>{
        let query ={

        }
        const result = await productCatCollection.find(query).sort({"category": 1}).toArray();
        res.send(result)
    })
    //get products category by id
    app.get('/products/category/:id' , async(req ,res) =>{
        const id = req.params.id
        let query ={
            _id: ObjectId(id)
        }
        const result = await productCatCollection.findOne(query);
        res.send(result)
    })

    //get Featured or Advertise products
    app.get('/advertise' , async(req ,res) =>{

        let query ={
            featured:{$eq: true},
            isStock:{$eq: true}
        }

        const result = await productCollection.find(query).sort({"name": 1}).toArray();
        res.send(result)
    })
    // post user form client side

    app.post('/users' , async(req ,res) =>{
        const user = req.body;
        console.log(user);
        const userInsert = await usersCollection.insertOne(user) 
        res.send(userInsert);
    })


}
run().catch(console.dir); 
 
 
app.get('/' , (req ,res) =>{
res.send('server is running');
})
 
app.listen(port, ()=>{
console.log(`Server is running at ${port}`);
})
