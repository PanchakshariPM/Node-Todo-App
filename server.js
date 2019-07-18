const { mongoose } = require('./db-connections/db')
const { Todo } = require('./models/todo')
const { Users } = require('./models/users')

var express = require('express')
var bodyParser = require('body-parser')
var { ObjectID } = require('mongodb')
var _ = require('lodash');
var { authentication } = require('./middlewares/authentication')

var app = express();
app.use(bodyParser.json());

app.post('/create_todos', authentication, (req, res) => {

    var createTodo = new Todo({
        todo: req.body.todo,
        isDone: req.body.isDone,
        completedAt: req.body.completedAt,
        _creator: req.user._id
    })

    createTodo.save().then((createdTodo) => {
        console.log({ createdTodo });

        res.send({ createdTodo })
    }).catch((err) => {
        res.status(400).send(err)
    })

});

app.get('/todos', authentication, (req, res) => {

    Todo.find({
        _creator: req.user._id
    }).then((allTodos) => {
        console.log({ allTodos });
        res.send({
            allTodos,
            message: 'Success'
        })
    }).catch((err) => {
        res.status(400).send({ err, error: 'Unable to get all Todos' })
    })

});

app.get('/todos/:id', authentication, (req, res) => {
    var id = req.params.id

    if (!ObjectID.isValid(id)) {
        return res.status(400).send('Invalid Todo ID')
    }

    Todo.findOne({
        _id: id,
        _creator: req.user.id
    }).then((specificTodo) => {
        if (!specificTodo) {
            return res.send('This ID is not found for this User')
        }
        res.send(specificTodo)
    }).catch((e) => {
        res.status(400).send({ e, message: 'Unable to find this ID' })
    })
});

app.delete('/todos/:id', authentication, (req, res) => {
    var id = req.params.id

    if (!ObjectID.isValid(id)) {
        return res.status(400).send('Invalid ID')
    }

    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user.id
    }).then((deletedTodo) => {
        if (!deletedTodo) {
            return res.status(400).send('This ID is not found for this User')
        }
        res.status(200).send({ deletedTodo, message: 'Deleted Successfully!' })

    }).catch((err) => {
        res.send(err)
    })
});

//FOR USERS APIS:
app.post('/signup_user', (req, res) => {
    var body = _.pick(req.body, ['email', 'password'])

    var newUser = new Users(body)

    newUser.save().then(() => {
        return newUser.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send({ newUser, message: 'User Registered Successfully!' })
    }).catch((err) => {
        res.send(err)
    })
});

app.get('/users', (req, res) => {
    Users.find().then((allUsers) => {
        res.send({ allUsers })
    }).catch((err) => { res.send(err) })
});

app.get('/users/me', authentication, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {

    // Someother method:
    // Users.findByCredentials(req, res);

    var body = _.pick(req.body, ['email', 'password']);

    Users.findByCredentials(body.email, body.password).then((userInfo) => {

        userInfo.generateAuthToken().then((token) => {
            res.header('x-auth', token).send({ userInfo, message: 'Logged In Successfully!' })
        })

    }).catch((e) => {
        res.status(404).send({ e, message: 'No user found by this credentials' })
    })

});

app.delete('/users/logout', authentication, (req, res) => {

    req.user.removeToken(req.token).then(() => {
        res.status(200).send({ message: 'Logged Out Successfully!' })
    }, () => {
        res.status(400).send()
    })

});

app.listen(3000, () => {
    console.log('Todo app up and running on port 3000');
});

