const mongoose = require('mongoose')

var Todo = mongoose.model('Todo', {
    todo: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    isDone: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

module.exports = { Todo }