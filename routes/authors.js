const express = require('express');
const router = express.Router();
const Author = require('../models/author');
const Book = require('../models/book');

// All Authors Route
router.get('/', async (request, response) => {
  let searchOptions = {}
  if (request.query.name !== null || request.query.name !== '') {
    searchOptions.name = new RegExp(request.query.name, 'i');
  }
  try {
    const authors = await Author.find(searchOptions);
    response.render('authors/index', {
      authors: authors,
      searchOptions: request.query
    });
  } catch {
    response.redirect('/');
  }
});

// New Author Route
router.get('/new', (request, response) => {
  response.render('authors/new', { author: new Author() });
});

// Create Author Route
router.post('/', async (request, response) => {
  const author = new Author({
    name: request.body.name
  });

  try {
    const newAuthor = await author.save();
    response.redirect(`authors/${newAuthor.id}`);
  } catch {
    response.render('authors/new', {
      author: author,
      errorMessage: 'Error creating Author'
    });
  }
});

// --- Actions -------------------------------------------

// Show
router.get('/:id', async (request, response) => {
  try {
    const author = await Author.findById(request.params.id);
    const books = await Book.find({ author: author.id }).limit(6).exec();
    response.render('authors/show', {
      author: author,
      booksByAuthor: books
    });
  } catch {
    response.redirect('/');
  }
});

// Edit
router.get('/:id/edit', async (request, response) => {
  try {
    const author = await Author.findById(request.params.id);
    response.render('authors/edit', { author: author });
  } catch {
    response.redirect('/authors');
  }
});

// Update
router.put('/:id', async (request, response) => {
  let author;
  try {
    author = await Author.findById(request.params.id);
    author.name = request.body.name;
    await author.save();
    response.redirect(`/authors/${author.id}`);
  } catch {
    if (author === null) {
      response.redirect('/');
    } else {
      response.render('authors/edit', {
        author: author,
        errorMessage: 'Error updating Author'
      });
    }
  }
});

router.delete('/:id', async (request, response) => {
  let author;
  try {
    author = await Author.findById(request.params.id);
    await author.remove();
    response.redirect('/authors');
  } catch {
    if (author === null) {
      response.redirect('/');
    } else {
      response.redirect(`/authors/${author.id}`);
    }
  }
});

module.exports = router;

