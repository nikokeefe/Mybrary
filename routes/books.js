const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/book');
const uploadPath = path.join('public', Book.coverImageBasePath);
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const upload = multer({
  dest: uploadPath,
  fileFilter: (request, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  }
})

// All Books Route
router.get('/', async (request, response) => {
  let query = Book.find();
  // Search title
  if (request.query.title !== null && request.query.title !== '') {
    query = query.regex('title', new RegExp(request.query.title, 'i'));
  }
  //Search published before/after
  if (request.query.publishedAfter !== null &&
    request.query.publishedAfter !== '') {
    query = query.gte('publishDate', request.query.publishedAfter);
  }
  if (request.query.publishedBefore !== null &&
    request.query.publishedBefore !== '') {
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
router.post('/', upload.single('cover'), async (request, response) => {
  const fileName = request.file != null ? request.file.filename : null
  const book = new Book({
    title: request.body.title,
    author: request.body.author,
    publishDate: new Date(request.body.publishDate),
    pageCount: request.body.pageCount,
    coverImageName: fileName,
    description: request.body.description
  });

  try {
    const newBook = await book.save();
    // response.redirect(`books/${newBook.id}`)
    response.redirect('books');
  } catch (e) {
    // If a problem creating book, remove cover img
    if (book.coverImageName !== null) {
      removeBookCover(book.coverImageName);
    }
    renderNewPage(response, book, true);
  }
});

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), error => {
    if (error) console.error(error);
  });
}

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
}

module.exports = router;