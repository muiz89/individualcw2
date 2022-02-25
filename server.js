const { request } = require('express');
const express = require('express');
const { ObjectId } = require('mongodb');
const app = express();

app.use(express.json());

app.use((req, res, next) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', '*');
    next();
})
app.use((req, res, next) => {
    console.log(req.url);
    next()
})
const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect("mongodb+srv://root:root@cluster0.kdf3p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    , (err, client) => {
        db = client.db('Lesson');
        console.log("database connected");
    })

app.get('/', (req, res, next) => {
    res.send("welcome to backend");
})

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})

app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e)
        let response = { "message": "success" }
        res.send(response);
    })
})

const ObjectID = require('mongodb').ObjectID;

app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e)
        res.send(result)
    })
})


//update an object 

app.put('/collection/:collectionName/:id', (req, res, next) => {
    let id = new ObjectId(req.params.id)
    req.collection.update(
        { _id: id },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send(result.modifiedCount === 1 ? { msg: 'success' } : { msg: 'error' })
        })
    console.log(req.body)
})

app.listen(process.env.PORT || 3000,()=> {
    console.log("app running");
})