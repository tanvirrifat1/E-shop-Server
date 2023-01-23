const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afkplob.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    console.log('verify token', req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        const orderOptionCollection = client.db('E-shop').collection('OrderOptions')
        const bookingsCollection = client.db('E-shop').collection('bookings')
        const usersCollection = client.db('E-shop').collection('users')
        const feedbackCollection = client.db('E-shop').collection('feedback')

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

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { email: email };
            const booking = await bookingsCollection.find(query).toArray();
            res.send(booking)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                orderDate: booking.orderDate,
                email: booking.email,
                product: booking.product
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.orderDate}`
                return res.send({ acknowledged: false, message })
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '72h' })
                return res.send({ accessToken: token })
            }

            res.status(403).send({ accessToken: '' })
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { emailL: email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.put('/users/admin/:id', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        app.delete('/users/:id', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })

        app.post('/feedback', async (req, res) => {
            const feedback = req.body;
            const result = await feedbackCollection.insertOne(feedback);
            res.send(result)
        })

        app.get('/feedback', async (req, res) => {
            const query = {};
            const feedback = await feedbackCollection.find(query).toArray();
            res.send(feedback)
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