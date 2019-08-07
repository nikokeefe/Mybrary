const mongoose = require('mongoose');
const Book = require('./book');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

// Pre-deletion validation
authorSchema.pre('remove', function (next) {
  Book.find({ author: this.id }, (error, books) => {
    if (error) {
      next(error);
    } else if (books.length > 0) {
      next(new Error('This author still has books in the database'))
    } else {
      next();
    }
  })
})

module.exports = mongoose.model('Author', authorSchema);