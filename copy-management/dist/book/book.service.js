"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookService = void 0;
const common_1 = require("@nestjs/common");
const book_entity_1 = require("./entities/book.entity");
const author_service_1 = require("../author/author.service");
const genre_service_1 = require("../genre/genre.service");
let BookService = class BookService {
    authorService;
    genreService;
    constructor(authorService, genreService) {
        this.authorService = authorService;
        this.genreService = genreService;
    }
    books = [];
    create(createBookDto) {
        const genre = this.genreService.findOne(createBookDto.genreId);
        const authors = createBookDto.authorsId.map((a) => this.authorService.findOne(a));
        const newBook = new book_entity_1.Book();
        newBook.name = createBookDto.name;
        newBook.genre = genre;
        newBook.authors = authors;
        newBook.id = Math.random();
        this.books.push(newBook);
    }
    findAll() {
        return this.books;
    }
    findOne(id) {
        const book = this.books.find((g) => g.id == id);
        if (!book) {
            throw new common_1.NotFoundException();
        }
        return book;
    }
    update(id, updateBookDto) {
        const book = this.books.find((g) => g.id == id);
        if (!book) {
            throw new common_1.NotFoundException();
        }
        if (updateBookDto.name) {
            book.name = updateBookDto.name;
        }
    }
    remove(id) {
        this.books = this.books.filter((b) => b.id != id);
        return true;
    }
};
exports.BookService = BookService;
exports.BookService = BookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [author_service_1.AuthorService,
        genre_service_1.GenreService])
], BookService);
//# sourceMappingURL=book.service.js.map