const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afkplob.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const orderOptionCollection = client.db('E-shop').collection('OrderOptions')

        app.get('/OrderOptions', async (req, res) => {
            const query = {};
            const options = await orderOptionCollection.find(query).toArray();
            res.send(options)
        })

    }
    finally {

    }
}
run().catch(err => console.log(err))


app.get('/', async (req, res) => {
    res.send('E-shop server is running')
})

app.listen(port, () => console.log(`E-shop running on ${port}`))