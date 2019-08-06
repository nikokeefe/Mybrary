const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

// All Books Route
router.get('/', async (request, response) => {
  let query = Book.find();
  // Search title
  if (request.query.title != null && request.query.title != '') {
    query = query.regex('title', new RegExp(request.query.title, 'i'));
  }
  //Search published before/after
  if (request.query.publishedAfter != null &&
    request.query.publishedAfter != '') {
    query = query.gte('publishDate', request.query.publishedAfter);
  }
  if (request.query.publishedBefore != null &&
    request.query.publishedBefore != '') {
    query = query.lte('publishDate', request.query.publishedBefore);
  }

  try {
    const books = await query.exec();
    response.render('books/index', {
      books: books,
      searchOptions: request.query
    });
  } catch {
    response.redirect('/');
  }
});

// New Book Route
router.get('/new', async (request, response) => {
  renderNewPage(response, new Book());
});

// Create Book Route
router.post('/', async (request, response) => {
  const book = new Book({
    title: request.body.title,
    author: request.body.author,
    publishDate: new Date(request.body.publishDate),
    pageCount: request.body.pageCount,
    description: request.body.description
  });
  saveCover(book, request.body.cover);

  try {
    const newBook = await book.save();
    // response.redirect(`books/${newBook.id}`)
    response.redirect('books');
  } catch (e) {
    renderNewPage(response, book, true);
  }
});

async function renderNewPage(response, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book
    };
    if (hasError) params.errorMessage = 'Error Creating Book';
    response.render('books/new', params);
  } catch {
    response.redirect('/books');
  }
};

function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, 'base64');
    book.coverImageType = cover.type;
  }
};

module.exports = router;