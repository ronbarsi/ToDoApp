const mongoose = require('mongoose')

const statuses = {
    TODO: 'To do',
    IN_PROGRESS: 'In progress',
    BLOCKED: 'Blocked',
    DONE: 'Done'
} 

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    default: ""
  },
  compelationStatus: {
    type: String,
    required: true,
    default: statuses.TODO
  },
  creationTime : {
    type: Date,
    required: true,
    default: Date.now
  }
})

module.exports = mongoose.model('Note', noteSchema)