const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 4000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@resell-game-console-mar.8cywhdv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

const run = async () => {
	try {
		const productCollection = client.db("rgc-db").collection("products");
		const productCatCollection = client.db("rgc-db").collection("pdctCategory");
		const usersCollection = client.db("rgc-db").collection("users");
		const bookingsCollection = client.db('rgc-db').collection('bookings');

		// jwt user Token
		app.get('/userjwt' , async(req ,res) =>{
		const email = req.query.email
		const query={
			email:email
		}
		console.log(email);
		const user = await usersCollection.findOne(query)
		console.log(user);
		 if(user){
			const token = jwt.sign(
				{ email }, 
				process.env.ACCESS_TOKEN, 
				{ expiresIn: '7d' })
			return res.send({
				accessUserToken: token 
			})
		 }
		 res.status(403).send({
			accessUserToken: '' 
		})

		})
		

		//get products
		app.get("/products", async (req, res) => {
			const email = req.query.email;
			const category = req.query.category;

			let query = {};
			if (email) {
				query = {
					email: email,
				};
			} else if (category) {
				query = {
					category: category,
				};
			}else{
                query = {}
            }

			const result = await productCollection.find(query).toArray();
			res.send(result);
		});
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }
		//get products category
		app.get("/products/category", async (req, res) => {
			let query = {};
			const result = await productCatCollection
				.find(query)
				.sort({ "category": 1 })
				.toArray();
			res.send(result);
		});
		
        //get products category by id
	app.get("/products/category/:id", async (req, res) => {
		const id = req.params.id;
		let query = {
			_id: ObjectId(id),
		};
		const result = await productCatCollection.findOne(query);
		res.send(result);
	});
	
    //get products by email
	app.get("/products", async (req, res) => {
		const email = req.query.email;
		let query = {
			email: email,
		};
		const result = await productCatCollection
			.find(query)
			.sort({ "name": 1 })
			.toArray();
		res.send(result);
	});
        //get Featured or Advertise products
        app.get("/advertise", async (req, res) => {
            let query = {
                featured: { $eq: true },
                isStock: { $eq: true },
            }

            const result = await productCollection
                .find(query)
                .sort({ "name": 1 })
                .toArray();
            res.send(result);
        });

        // post user form client side
	app.post("/users", async (req, res) => {
		const user = req.body;
		console.log(user);
		const userInsert = await usersCollection.insertOne(user);
		res.send(userInsert);
	});
// get all user

app.get("/users", async (req, res) => {
    const role = req.query.role;
    let query = {};
    if (role === "seller") {
        query = {
            role: { $eq: "seller" },
        };
    } else if (role === "admin") {
        query = {
            role: { $eq: "admin" },
        };
    } else if (role === "buyer") {
        query = {
            role: { $eq: "buyer" },
        };
    }

    const users = await usersCollection.find(query).toArray();
    res.send(users);
});

// booking
app.post('/bookings', async (req, res) => {
	const booking = req.body;
	console.log(booking);
	
	const result = await bookingsCollection.insertOne(booking);
	res.send(result);
});
// booking
app.get('/bookings',verifyJWT, async (req, res) => {
	const email= req.query.email
	const query ={
		email:email
	}
	const result = await bookingsCollection.find(query).toArray();
	res.send(result);
});
// verify admin

app.get("/users/admin/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email }
    const user = await usersCollection.findOne(query);
   
    if(user.role === "admin"){
     return res.send(true);
    }
    res.send(false)
});
app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
	const id = req.params.id;
	const filter = { _id: ObjectId(id) }
	const options = { upsert: true };
	const updatedDoc = {
		$set: {
			role: 'admin'
		}
	}
	const result = await usersCollection.updateOne(filter, updatedDoc, options);
	res.send(result);
});

// app.post('/create-payment-intent', async (req, res) => {
// 	const booking = req.body;
// 	const price = booking.price;
// 	const amount = price * 100;

// 	const paymentIntent = await stripe.paymentIntents.create({
// 		currency: 'usd',
// 		amount: amount,
// 		"payment_method_types": [
// 			"card"
// 		]
// 	});

// 	const clientSecret = 
// 		{
// 			clientSecret: paymentIntent.client_secret,
// 		}
// 	res.send(clientSecret);
// });
// verify seller
app.get("/users/seller/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    if(user.role === "seller"){
        return res.send(true);
       }
       res.send(false)
});

app.get('/users/seller' , async(req ,res) =>{
	const email = req.query.email;
	const query = { email:email}
	const user = await usersCollection.findOne(query);
	res.send(user)
})


app.put("/users/seller/:id", async (req, res) => {
    const id = req.params.id;
    const filter = {
        _id: ObjectId(id),
    };
    const options = {
        upsert: true,
    };
    const updateDoc = {
        $set: {
            isVerified: true,
        },
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
	res.send(result);
	const query ={
		_id: ObjectId(id)
	}
	const user = await usersCollection.findOne(query);
   console.log('userInformation', user.email);

   const sellerProducts = {
	email: user.email
   }
		const sellerOptions = {
				upsert: true,
		};

		const sellerUpdateDoc = {
	$set: {
		isVerified: true,
		sellerName:user.name,
	},
		};
const productsUpdateCol =  await productCollection.updateMany(sellerProducts, sellerUpdateDoc, sellerOptions);
console.log(productsUpdateCol);
});

	// verify buyer
	app.get("/users/buyer/:email", async (req, res) => {
		const email = req.params.email;
		const query = { email };
		const user = await usersCollection.findOne(query);
        if(user.role === "buyer"){
            return res.send(true);
           }
           res.send(false)
	});


	app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
		const id = req.params.id;
		const query = {
			_id: ObjectId(id),
		};
		const deleteUser = await usersCollection.deleteOne(query);
		res.send(deleteUser);
	});

	// app.post('/payments', async (req, res) =>{
	// 	const payment = req.body;
	// 	const result = await paymentsCollection.insertOne(payment);
	// 	const id = payment.bookingId
	// 	const filter = {_id: ObjectId(id)}
	// 	const updatedDoc = {
	// 		$set: {
	// 			paid: true,
	// 			transactionId: payment.transactionId
	// 		}
	// 	}
	// 	const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
	// 	res.send(result);
	// })


	} finally {
	}
};
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("server is running");
});

app.listen(port, () => {
	console.log(`Server is running at ${port}`);
});
