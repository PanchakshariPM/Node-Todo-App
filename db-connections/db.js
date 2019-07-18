const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/NewTodoApp',
    { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true });

module.exports = { mongoose };