"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreService = void 0;
const common_1 = require("@nestjs/common");
const genre_entity_1 = require("./entities/genre.entity");
let GenreService = class GenreService {
    genres = [];
    create(createGenreDto) {
        const newGenre = new genre_entity_1.Genre();
        newGenre.name = createGenreDto.name;
        newGenre.Id = Math.random();
        this.genres.push(newGenre);
        return newGenre.Id;
    }
    findAll() {
        return this.genres;
    }
    findOne(id) {
        return `This action returns a #${id} genre`;
    }
    update(id, updateGenreDto) {
        return `This action updates a #${id} genre`;
    }
    remove(id) {
        this.genres = this.genres.filter((g) => g.Id != id);
        return true;
    }
};
exports.GenreService = GenreService;
exports.GenreService = GenreService = __decorate([
    (0, common_1.Injectable)()
], GenreService);
//# sourceMappingURL=genre.service.js.map