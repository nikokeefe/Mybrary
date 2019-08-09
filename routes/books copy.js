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
    response.redirect(`books/${newBook.id}`)
  } catch (e) {
    console.log(e);
    renderNewPage(response, book, true);
  }
});



// Show Book Route
router.get('/:id', async (request, response) => {
  try {
    const book = await Book
      .findById(request.params.id)
      .populate('author')
      .exec()
    response.render('books/show', { book: book });
  } catch {
    response.redirect('/');
  }
});

// Edit Book Route
router.get('/:id/edit', async (request, response) => {
  try {
    const book = await Book.findById(request.params.id);
    renderEditPage(response, book);
  } catch {
    response.redirect('/');
  }
});

// Update Book Route
router.put('/:id', async (request, response) => {
  let book;
  
  try {
    book = await Book.findById(request.params.id);
    book.title = request.body.title;
    book.author = request.body.author;
    book.publishDate = new Date(request.body.publishDate);
    book.pageCount = request.body.pageCount;
    book.description = request.body.description;
    if (request.body.cover != null && request.body.cover !== '') {
      saveCover(book, request.body.cover);
    }
    await book.save();
    response.redirect(`/books/${book.id}`);
  } catch {
    if (book != null) {
      renderEditPage(response, book, true);
    } else {
      redirect('/');
    }
  }
});

// Delete Book Route
router.delete('/:id', async (request, response) => {
  let book;
  try {
    book = await Book.findById(request.params.id);
    await book.remove();
    response.redirect('/books');
  } catch {
    if (book != null) {
      response.render('books/show', {
        book: book,
        errorMessage: 'Could not remove book.'
      });
    } else {
      response.redirect('/');
    }
  }
});


async function renderNewPage(response, book, hasError = false) {
  renderFormPage(response, book, 'new', hasError)
};

async function renderEditPage(response, book, hasError = false) {
  renderFormPage(response, book, 'edit', hasError)
};

async function renderFormPage(response, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book
    };
    if (hasError) {
      if (form === 'edit') {
        params.errorMessage = 'Error Updating Book';
      } else {
        params.errorMessage = 'Error Creating Book';
      }      
    }
    response.render(`books/${form}`, params);
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