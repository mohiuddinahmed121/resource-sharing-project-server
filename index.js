const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0lug6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});

async function run() {
   try {
      //await client.connect();
      const database = client.db("resourceSharingDB");
      const uploadsCollection = database.collection("uploadsData");

      app.post("/uploadedPdfs", async (req, res) => {
         const newUpload = req.body;
         const result = await uploadsCollection.insertOne(newUpload);
         res.send(result);
      });

      app.get("/uploadedPdfs", async (req, res) => {
         try {
            const cursor = uploadsCollection.find();

            const result = await cursor.toArray();

            res.json(result);
         } catch (error) {
            console.error("Error fetching uploaded PDFs:", error);
            res.status(500).json({ error: "Failed to fetch uploaded PDFs" });
         }
      });

      app.get("/search", async (req, res) => {
         try {
            const searchQuery = req.query.q;

            if (!searchQuery) {
               return res.status(400).json({ error: "Search query is required" });
            }

            const searchRegex = new RegExp(searchQuery, "i"); // case-insensitive search

            const cursor = uploadsCollection.find({
               $or: [
                  { pdfName: searchRegex },
                  { course: searchRegex },
                  { department: searchRegex },
                  { school: searchRegex },
                  { docType: searchRegex },
               ],
            });

            const results = await cursor.toArray();
            res.json(results);
         } catch (error) {
            console.error("Error in /search:", error);
            res.status(500).json({ error: "Search failed" });
         }
      });

      app.get("/uniprofile/:school", async (req, res) => {
         const school = req.params.school; // this gets path param

         try {
            const results = await uploadsCollection.find({ school }).toArray();
            res.json(results);
         } catch (error) {
            console.error("Error fetching university profile data:", error);
            res.status(500).json({ error: "Failed to fetch university profile data" });
         }
      });

      app.get("/uploadsByEmail/:email", async (req, res) => {
         const email = req.params.email;
         try {
            const userUploads = await uploadsCollection.find({ uploaderEmail: email }).toArray();
            res.json(userUploads);
         } catch (error) {
            res.status(500).json({ error: "Failed to fetch user uploads" });
         }
      });

      console.log("Connected to MongoDB!");
   } catch (error) {
      console.error(error);
   }
}
run();

app.get("/", (req, res) => {
   res.send("Resource Sharing App is Running");
});

app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});
