const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {connectToDb, getDb} = require('./db');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());

let db;
connectToDb((err) => {
    if (!err) {
        db = getDb();
    }
});

app.listen(5001, () => {
    console.log('Server started on port 5000');
});

//routes
app.get('/blogs', (req, res) => {
    db.collection('blogs')
        .find()
        .toArray()
        .then((blogs) => {
            res.status(200).json(blogs);
        })
        .catch(() => {
            res.status(500).json({message: 'Could not fetch blogs'});
        });
});

app.get('/blogs/search/:searchTerm', (req, res) => {
    const searchTerm = req.params.searchTerm;
    const query = {
        $or: [
            {title: {$regex: searchTerm, $options: 'i'}},
            {name: {$regex: searchTerm, $options: 'i'}},
        ],
    };

    db.collection('blogs')
        .find(query)
        .toArray()
        .then((blogs) => {
            res.status(200).json(blogs);
        })
        .catch(() => {
            res.status(500).json({message: 'Could not fetch blogs'});
        });
});

app.get('/blogs/:id', (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        db.collection('blogs')
            .findOne({_id: new ObjectId(req.params.id)})
            .then((blog) => {
                res.status(200).json(blog);
            })
            .catch(() => {
                res.status(500).json({message: 'Could not fetch blog'});
            });
    } else {
        res.status(500).json({error: 'Invalid id'});
    }
});

app.post('/blogs', (req, res) => {
    const blog = req.body;
    db.collection('blogs')
        .insertOne(blog)
        .then((result) => {
            res.status(201).json(result);
        })
        .catch((err) => {
            res.status(500).json({message: 'Could not create blog'});
        });
});

app.delete('/blogs/:id', (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        db.collection('blogs')
            .deleteOne({_id: new ObjectId(req.params.id)})
            .then((result) => {
                res.status(200).json(result);
            })
            .catch(() => {
                res.status(500).json({message: 'Could not delete blog'});
            });
    } else {
        res.status(500).json({error: 'Invalid id'});
    }
});

app.patch('/blogs/:id', (req, res) => {
    const updates = req.body;
    if (ObjectId.isValid(req.params.id)) {
        db.collection('blogs')
            .updateOne({_id: new ObjectId(req.params.id)}, {$set: updates}, {upsert: true})
            .then((result) => {
                res.status(200).json(result);
            })
            .catch(() => {
                res.status(500).json({message: 'Could not update blog'});
            });
    } else {
        res.status(500).json({error: 'Invalid id'});
    }
});

app.get('/blogs/user/:userId', (req, res) => {
    db.collection('blogs')
        .find({userId: req.params.userId})
        .toArray()
        .then((blogs) => {
            res.status(200).json(blogs);
        })
        .catch(() => {
            res.status(500).json({message: 'Could not fetch blogs'});
        });
});

app.get('/users', (req, res) => {
    const userName = req.query.userName;

    if (userName) {
        db.collection('users')
            .find({name: {$regex: userName, $options: 'i'}})
            .toArray()
            .then((users) => {
                res.status(200).json(users);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({message: 'Could not fetch users'});
            });
    } else {
        db.collection('users')
            .find()
            .toArray()
            .then((users) => {
                res.status(200).json(users);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({message: 'Could not fetch users'});
            });
    }
});

app.post('/users', async (req, res) => {
    const {username, password} = req.body;

    // hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // create a new user object
    const newUser = {username, password: hashedPassword};

    // insert the new user object into the "users" collection
    db.collection('users')
        .insertOne(newUser)
        .then(() => {
            res.status(201).send('User created successfully');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Failed to create user');
        });
});

app.get('/users/:id', (req, res) => {
    db.collection('users')
        .findOne({_id: new ObjectId(req.params.id)})
        .then((user) => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({message: 'User not found'});
            }
        })
        .catch(() => {
            res.status(500).json({message: 'Could not fetch user'});
        });
});

app.get('/blogs/title/:title', (req, res) => {
    const title = req.params.title;
    db.collection('blogs')
        .findOne({title: title})
        .then((blog) => {
            if (!blog) {
                res.status(404).json({message: 'Blog not found'});
            } else {
                res.status(200).json(blog);
            }
        })
        .catch(() => {
            res.status(500).json({message: 'Could not fetch blog'});
        });
});
