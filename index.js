const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fuqgtsz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    const database = client.db("career_path");
    const jobCollection = database.collection("jobCollection");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    app.get("/allJobs", async(req, res)=>{
        const cursor = jobCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get("/onSiteJobs", async(req, res)=>{
        const query = {"jobCategory":"On-site Job"};
        const cursor = jobCollection.find(query);
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get("/remoteJobs", async(req, res)=>{
      const query = {"jobCategory":"Remote Job"};
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get("/hybridJobs", async(req, res)=>{
      const query = {"jobCategory":"Hybrid"};
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get("/partTimeJobs", async(req, res)=>{
      const query = {"jobCategory":"Part-Time"};
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get("/job/:id", async(req, res)=>{
      const id = req.params.id;
      const cursor = {_id: new ObjectId(id)};
      const result = await jobCollection.findOne(cursor);
      res.send(result)
    })

    app.post("/addJob", async(req, res)=>{
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result)
    })
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res)=>{
    res.send("Welcome to the Career Path Server!!")
})


app.listen(port, ()=>{
    console.log(`Listening to the port ${port}`)
})