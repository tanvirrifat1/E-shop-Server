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
        const bookingsCollection = client.db('E-shop').collection('bookings')

        app.get('/OrderOptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await orderOptionCollection.find(query).toArray();
            const bookingQuery = { orderDate: date };
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.product === option.name);
                const bookingSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookingSlots.includes(slot));
                option.slots = remainingSlots
            })
            res.send(options)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
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