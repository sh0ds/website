const myLibrary = [];

const bookTitle = document.getElementById("title");
const bookAuthor = document.getElementById("author");
const bookPages = document.getElementById("pages");
const bookButton = document.getElementById("book-button");
const mainContainer = document.querySelector("main");

function Book(bookTitle, authorName, pagesCount, isRead) {
  this.bookID = crypto.randomUUID();
  this.title = bookTitle;
  this.author = authorName;
  this.pages = pagesCount;
  this.read = isRead;
}

function addBook() {
  const title = bookTitle.value.trim();
  const author = bookAuthor.value.trim();
  const pages = bookPages.value.trim();

  if (!title) {
    alert("Please enter a book title!");
    return;
  } else if (!author) {
    alert("Please enter a book author!");
    return;
  } else if (!pages || pages <= 0) {
    alert("Please enter a valid page count!");
    return;
  }

  const newBook = new Book(title, author, parseInt(pages), false);
  myLibrary.push(newBook);

  displayBooks();
  bookTitle.value = "";
  bookAuthor.value = "";
  bookPages.value = "";
}

function displayBooks() {
  mainContainer.innerHTML = "";
  myLibrary.forEach((book) => {
    const bookDiv = document.createElement("div");
    bookDiv.className = `book ${book.read ? "read" : "unread"}`;
    bookDiv.innerHTML = `
      <strong>${book.title}</strong><br>
      <em>${book.author}</em><br>
      <span class="pages">${book.pages} pages</span><br><br>
      <button class="btn btn-toggle" onclick="toggleRead('${book.bookID}')">
        ${book.read ? "✓ Read" : "Mark as Read"}
      </button>
      <button class="btn btn-delete" onclick="deleteBook('${book.bookID}')">Delete</button>
    `;
    mainContainer.appendChild(bookDiv);
  });
}

function deleteBook(id) {
  const index = myLibrary.findIndex(book => book.bookID === id);
  if (index > -1) {
    myLibrary.splice(index, 1);
  }
  displayBooks();
}

function toggleRead(id) {
  const book = myLibrary.find(b => b.bookID === id);
  if (book) book.read = !book.read;
  displayBooks();
}

bookButton.addEventListener("click", addBook);
bookTitle.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    addBook();
  }
});
bookAuthor.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    addBook();
  }
});
bookPages.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    addBook();
  }
});