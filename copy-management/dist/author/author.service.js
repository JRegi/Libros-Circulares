"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorService = void 0;
const common_1 = require("@nestjs/common");
const author_entity_1 = require("../author/entities/author.entity");
let AuthorService = class AuthorService {
    authors = [];
    create(createAuthorDto) {
        const newAuthor = new author_entity_1.Author();
        newAuthor.name = createAuthorDto.name;
        newAuthor.id = Math.random();
        this.authors.push(newAuthor);
    }
    findAll() {
        return this.authors;
    }
    findOne(id) {
        const author = this.authors.find((a) => a.id == id);
        if (!author) {
            throw new common_1.NotFoundException();
        }
        return author;
    }
    update(id, updateAuthorDto) {
        const author = this.authors.find((a) => a.id == id);
        if (!author) {
            throw new common_1.NotFoundException();
        }
        author.name = updateAuthorDto.name;
    }
    remove(id) {
        this.authors = this.authors.filter((a) => a.id != id);
    }
};
exports.AuthorService = AuthorService;
exports.AuthorService = AuthorService = __decorate([
    (0, common_1.Injectable)()
], AuthorService);
//# sourceMappingURL=author.service.js.map