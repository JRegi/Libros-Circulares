# CLAUDE.md

"Libros Circulares" — university TP (Desarrollo de Software I). The assignment brief is `Consigna.pdf`.

## Structure

Three independent NestJS services, each with its own `package.json` and `node_modules`:

- `copy-management/` — books catalog: `author`, `genre`, `book`, `edition`, `publisher`, `copy` modules.
- `user-management/` — `user` module. Requirements live in `user-management/specification.md`; read it before changing this service.
- `operation-management/` — scaffold only (no feature modules yet).

Each feature module follows the Nest CLI layout: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`, plus `*.spec.ts`.

## Conventions

- **No database**: data is stored in in-memory arrays inside services; IDs are generated with `Math.random()`.
- Missing records throw `NotFoundException`.
- Cross-module lookups go through the other module's service (e.g. `BookService` uses `AuthorService`/`GenreService`), so that module must export its service.
- Don't edit `dist/` (build output).
- Everything in English: code, identifiers, comments, error messages, docs, READMEs, specifications and `specification-changes.md` files. Never write Spanish; if you find Spanish text in the repo, translate it to English.
- Whenever you make changes document them in the corresponding specification-changes.md of the management module / NestJS project.

## Commands (run inside a service folder)

```sh
npm run start:dev   # dev server, PORT env or 3000
npm run build
npm run lint        # oxlint
npm test            # jest
```

All three default to port 3000 — set `PORT` to run them together.
