const { request } = require('express');
const express = require('express');
const { ObjectId } = require('mongodb');
const app = express();

app.use(express.json());
app.set('port', 3000);
app.use((req, res, next) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', '*');
    next();
})

const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect("mongodb+srv://root:root@cluster0.kdf3p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    , (err, client) => {
        db = client.db('Lesson');
    })

app.get('/', (req, res, next) => {
    res.sendFile('text.html', { root: __dirname });
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
        // console.log("fuck this shit")
    })
    // console.log(req.body);
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