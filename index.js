const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: ['http://localhost:5173',
    'https://career-path-3991e.web.app',
    'https://career-path-3991e.firebaseapp.com'

  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const verifyToken = async(req, res, next)=>{
  const token = req?.cookies?.token;
  if(!token){
   return res.status(401).send({message : "Not Authorized"})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: "Not Authorized"})
    }
    console.log("Value in the token", decoded)
    req.user = decoded;
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fuqgtsz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const cookieOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production"? "none" : "strict",
  secure: process.env.NODE_ENV === "production"? true : false,
}

async function run() {
    const database = client.db("career_path");
    const jobCollection = database.collection("jobCollection");
    const appliedJobsCollection = database.collection("appliedJobsCollection");
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

    app.get("/myJobs", verifyToken, async(req, res)=>{
      console.log("query", req.query.email);
      console.log("token owner", req.user.email)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: "Forbidden Access!!"})
      }
      let query = {};
      if(req.query?.email){
        query = {user: req.query.email}
      }
      // console.log(query)
      // console.log("cook cook",req?.cookies?.token)
      // console.log("token owner info", req.user)
     
      const result = await jobCollection.find(query).toArray();
        res.send(result)
    })

    app.post("/addJob", async(req, res)=>{
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result)
    })

    

    app.get("/appliedJob", verifyToken, async(req, res)=>{
      console.log("query", req.query.email);
      console.log("token owner", req.user.email);
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: "Forbidden Access!!"})
      }
      // console.log(req.user.email)
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await appliedJobsCollection.find(query).toArray();
      res.send(result);
    })

    app.post("/appliedJob/:id", async(req, res)=>{
      const job = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateResult = await jobCollection.updateOne(filter, {$inc:{"totalApplicants":1}})
      if(updateResult.modifiedCount === 0){
        throw new Error("Failed to update jobCollection")
      }
      const result = await appliedJobsCollection.insertOne(job);
      
      res.send(result)
    })

    app.post("/jwt", async(req, res)=>{
      const user = req.body;
      console.log("user of the token",user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 3600});
      res
      .cookie('token', token, cookieOption)
      .send({success : true})

      // .cookie('token', token, {
      //   httpOnly: true,
      //   secure: false,
      // })
    })

    app.post("/logout", async(req, res)=>{
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie('token', {...cookieOption, maxAge: 0}).send({success:true})
      // res.clearCookie('token', {maxAge: 0}).send({success:true})
    })

    app.delete("/myJobs/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobCollection.deleteOne(query);
      res.send(result)
    })

    app.put("/updatejob/:id", async(req, res)=>{
      const id = req.params.id;
      const updatedJob = req.body;
      const filter = {_id: new ObjectId(id)};
      const updatedJob2 = {
        $set:{
          photoUrl: updatedJob.photoUrl,
          jobTitle: updatedJob.jobTitle,
          jobCategory: updatedJob.jobCategory,
          salaryRange: updatedJob.salaryRange,
          jobDescription: updatedJob.jobDescription,
          jobPosting: updatedJob.jobPosting,
          deadline: updatedJob.deadline,
          totalApplicants: updatedJob.totalApplicantsNumber
        }
      } 
      const option = {upsert : true}
      const result = await jobCollection.updateOne(filter, updatedJob2, option);
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