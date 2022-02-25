const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
let db
const mongoClient  = require("mongodb").MongoClient;
// Connection URI
const uri =
"mongodb+srv://root:root@cluster0.kdf3p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoClient.connect(uri, (error, client) => {
    db = client.db("lesson")
    console.log("Database connected");
})

app.use(express.static('static'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.use((req, res, next) => {
    console.log("Incoming request for: " + req.url + " | Timestamp: " + new Date());
    next();
});

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = collectionName;
    return next()
});

app.param('id', (req, res, next, id) => {
    req.lessonId = id;
    return next()
});

app.param('searchTerm', (req, res, next, searchTerm) => {
    req.searchTerm = searchTerm;
    return next()
});

app.param('sortBy', (req, res, next, sortBy) => {
    req.sortBy = sortBy;
    return next()
});

app.param('sortOrder', (req, res, next, sortOrder) => {
    req.sortOrder = sortOrder;
    return next()
});

app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/lesson/price/asc')
});

//GET all lessons
app.get("/collection/:collectionName/:sortBy/:sortOrder", async (req, res) => {
    res.json(await getLessons(req.collection, "", req.sortBy, req.sortOrder));
});

//GET lessons that match a search term
app.get("/collection/:collectionName/:searchTerm/:sortBy/:sortOrder", async (req, res) => {
    res.json(await getLessons(req.collection, req.searchTerm, req.sortBy, req.sortOrder));
});

//POST(Create) a new order
app.post("/collection/:collectionName", async (req, res) => {
    try {
        res.json(await addOrder(req.body));
    } catch (error) {
        console.error(error);
    }
});

//PUT(Update) existing lesson available spaces
app.put("/collection/:collectionName/:id", async (req, res) => {
    try {
        res.json(await updateLesson(req.lessonId, req.body));
    } catch (error) {
        console.error(error);
    }
});

app.use(function (req, res) {
    res.status(404).send("Resource not found!");
});

app.listen(process.env.PORT || 3000, () => { let port = process.env.PORT || 3000; console.log("App started on port: " + port) });

/*async function connectToCluster() {
    let mongoClient;
    try {
        mongoClient = new MongoClient(uri);
        console.log('Connecting to MongoDB Atlas cluster...');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB Atlas!');
        return mongoClient;
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
}*/



async function openCollection(mongoCluster, collectionName) {
    let mongoCollection;
    try {
        const mongoDatabase = mongoCluster.db('booking_system');
        console.log("Connected to database: booking_system");
        mongoCollection = mongoDatabase.collection(collectionName);
        console.log("Connected to collection: " + collectionName);
        return mongoCollection;
    } catch (error) {
        console.error('Unable to open collection: ' + collectionName);
        process.exit();
    }
}

/*async function getLessons(collectionName, searchTerm, sortBy, sortOrder) {
    let mongoCluster
    try {
        mongoCluster = await connectToCluster();
        let mongoCollection = await openCollection(mongoCluster, collectionName);
        let jsonResponse = await findLessonByTopicOrLocation(mongoCollection, searchTerm, sortBy, sortOrder);
        console.log(jsonResponse);
        return jsonResponse;
    } finally {
        await mongoCluster.close();
        console.log("Cluster connection closed");
    }
}*/
app.get("/collection/:collectionName", (req, res, next) => {
    req.collection.find({}).toArray((error,result) => {
        if(error) next(error)

        res.send(result)
    })
})

async function findLessonByTopicOrLocation(collection, searchTerm, sortByFieldName, sortOrderString) {
    let regex = new RegExp(searchTerm, "i");
    let sortOrder = getSortOrder(sortOrderString);
    if (searchTerm != "") {
        try {
            let topicSearch = await collection.find({ topic: { $regex: regex } }, { sort: [[sortByFieldName, sortOrder]] }).toArray();
            if (topicSearch.length === 0) {
                let locationSearch = await collection.find({ location: { $regex: regex } }, { sort: [[sortByFieldName, sortOrder]] }).toArray();
                return locationSearch;
            } else {
                return topicSearch;
            }
        } catch (error) {
            console.error(error);
        }
    } 
    return await collection.find({}, { sort: [[sortByFieldName, sortOrder]] }).toArray();
}

function getSortOrder(sortOrderString) {
    return (sortOrderString == "asc") ? 1 : (sortOrderString == "desc") ? -1 : 1;
}

async function addOrder(orderContent) {
    let mongoCluster;
    try {
        mongoCluster = await connectToCluster();
        mongoCollection = await openCollection(mongoCluster, 'order');
        return await addNewOrder(mongoCollection, orderContent);
    } finally {
        await mongoCluster.close();
        console.log("Cluster connection closed");
    }
}

async function addNewOrder(collection, content) {
    return await collection.insertOne(content);
}

async function updateLesson(lessonId, contentToUpdate) {
    let mongoCluster;
    try {
        mongoCluster = await connectToCluster();
        mongoCollection = await openCollection(mongoCluster, 'lesson');
        return await updateLessonSpaces(mongoCollection, lessonId, contentToUpdate);
    } finally {
        await mongoCluster.close();
        console.log("Cluster connection closed");
    }
}

async function updateLessonSpaces(collection, id, contentToUpdate) {
    return await collection.updateOne(
        { id },
        { $set: contentToUpdate }
    );
}
