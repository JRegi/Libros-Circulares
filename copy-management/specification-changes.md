# Changes applied according to `copy-management-specification.md`

This document summarizes what was implemented in `copy-management` based on `copy-management-specification.md`, and the decisions made where the specification was not enough to decide. We were explicitly asked not to ask questions, so each of those decisions is marked as **Decision** so it can be reviewed.

## Summary

- The four resources in the spec (author, work, edition and copy) are implemented in memory, with their validations and error cases.
- `book` was replaced by a new module, `work`, which is the name the spec uses.
- `genre` and `publisher` were removed from the application. In the spec they are text fields (`Work.genre`, `Edition.publisher`), not entities of their own.
- `Copy` exposes `getCopy`, `changeOwner` and `changeHolder` for Service II to use, both in code and over HTTP.
- Before creating a copy, `user-management` is queried over HTTP to verify that the owner exists.
- Two scaffold configuration problems that prevented running `npm test` were fixed (they are the same ones already fixed in `user-management`).

## Modified / created files

| File | Status |
| --- | --- |
| `src/app.module.ts` | Modified: registers `AuthorModule`, `WorkModule`, `EditionModule` and `CopyModule`. `BookModule`, `GenreModule` and `PublisherModule` were removed. |
| `src/common/validation.ts` | New: shared helpers (`requireBody`, `rejectUnknownFields`, `validateText`, `validateId`, `generateId`). |
| `src/author/entities/author.entity.ts` | Rewritten according to the spec (`authorId`, `name`, `lastName`, `nationality`, `countryOfResidence`). |
| `src/author/dto/create-author.dto.ts` | Modified: the 4 fields from the spec. |
| `src/author/author.service.ts` | Rewritten: validates the data and returns `{ authorId }`. `update` and `remove` were removed. |
| `src/author/author.controller.ts` | Modified: `POST`, `GET` and `GET :id` (with `ParseIntPipe`). |
| `src/author/author.module.ts` | Modified: removed an unused import. |
| `src/work/**` | New module: entity, DTO, service, controller, module and the two scaffold `*.spec.ts` files, adapted from `book`. |
| `src/edition/**` | Entity, DTO, service, controller and module rewritten. The `*.spec.ts` files now register the new dependencies. |
| `src/copy/entities/copy.entity.ts` | Rewritten according to the spec. |
| `src/copy/dto/create-copy.dto.ts` | Modified: `editionId`, `ownerUserId`. |
| `src/copy/dto/change-owner.dto.ts`, `change-holder.dto.ts` | New. |
| `src/copy/clients/user.client.ts` | New: queries `user-management` over HTTP. |
| `src/copy/copy.service.ts`, `copy.controller.ts`, `copy.module.ts` | Rewritten. |
| `src/copy/*.spec.ts` | Only the providers that are now needed were added. |
| `tsconfig.json` | `"rootDir": "./"` (see [Testing](#testing)). |
| `package.json` | The Jest scripts run with `--experimental-vm-modules` (see [Testing](#testing)). |
| `specification-changes.md` | This file. |

**Not modified**, and left in the repo without being registered in `AppModule`: `src/book/`, `src/genre/`, `src/publisher/` and the `dto/update-*.dto.ts` files of `author`, `edition` and `copy`. Deleting them was attempted, but the environment blocked file deletion. **They can be deleted by hand without breaking anything**, because no active file imports them. While they are still there:
- `npm run lint` shows 4 warnings, all in those files.
- The 2 `book` `*.spec.ts` files fail (see [Results](#results)).

No new tests were written in the repo, because the spec says "Do not generate tests". No dependencies were added either: HTTP calls use Node's native `fetch`.

## Entities

All four are exactly the same as in the spec: `Author`, `Work` (with `authors: Author[] = []`), `Edition` (with `workId`) and `Copy` (`copyId`, `editionId`, `ownerUserId`, `holderUserId`).

## Endpoints

| Method | Route | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/author` | `{ name, lastName, nationality, countryOfResidence }` | `201 { authorId }` | 400 |
| GET | `/author` | — | `200 Author[]` | — |
| GET | `/author/:id` | — | `200 Author` | 400 (non-numeric id), 404 |
| POST | `/work` | `{ title, genre, authorIds }` | `201 { workId }` | 400; 404 if any author does not exist |
| GET | `/work` | — | `200 Work[]` | — |
| GET | `/work/:id` | — | `200 Work` (with the full authors) | 400, 404 |
| POST | `/edition` | `{ workId, publisher, year }` | `201 { editionId }` | 400; 404 if the work does not exist |
| GET | `/edition` | — | `200 Edition[]` | — |
| GET | `/edition/:id` | — | `200 Edition` | 400, 404 |
| POST | `/copy` | `{ editionId, ownerUserId }` | `201 { copyId }` | 400; 404 if the edition or the user does not exist; 503 if `user-management` does not respond |
| GET | `/copy` | — | `200 Copy[]` | — |
| GET | `/copy/:id` | — | `200 { copyId, editionId, ownerUserId, holderUserId }` | 400, 404 |
| PATCH | `/copy/:id/owner` | `{ newOwnerUserId }` | `200` (no body) | 400, 404, 503 |
| PATCH | `/copy/:id/holder` | `{ newHolderUserId }` | `200` (no body) | 400, 404, 503 |

The `/book`, `/genre` and `/publisher` routes no longer exist, nor do the generic `PATCH`/`DELETE` routes for author, edition and copy.

### Common validations

- If the body is missing, the response is `400`.
- If the body has fields that are not in the DTO, the response is also `400` (`Unknown fields: ...`). This way a typo does not go unnoticed. It is the same criterion `user-management` uses.
- Text fields must be non-empty strings. They are stored with leading and trailing spaces trimmed.
- Ids in the body must be positive integers of type `number`: `"123"` as a string gives `400`.
- If a validation fails, nothing is stored.

## Decisions

1. **`book` is renamed to `work`.** The spec defines the `Work` entity and the "Create work" operation. With the `/work` route and the `workId` field, the code matches the spec.
2. **`genre` and `publisher` are text and not entities.** That is how the spec defines them (`genre: string`, `publisher: string`). It also says the service manages *only* works, editions, authors and copies.
3. **There are no update or delete endpoints** for authors, works or editions, because the spec does not ask for them. Decommissioning copies belongs to Service II.
4. **Owner existence:** users live in another process (`user-management`). That is why `UserClient` calls `GET {USER_MANAGEMENT_URL}/user/:id`:
   - If it responds `404`, the response is `404 User X not found`.
   - If it cannot connect, or it responds with another error, the response is `503`.
   - The URL is configured with the `USER_MANAGEMENT_URL` environment variable. The default is `http://localhost:3001`, so `user-management` must be started with `PORT=3001`, or the variable must be changed.
5. **`changeOwner` and `changeHolder` return `Promise<void>` instead of `void`,** because they also verify that the new user exists in `user-management`, and that is an HTTP call. Since Service II is another process, they are also exposed as `PATCH /copy/:id/owner` and `PATCH /copy/:id/holder`. `getCopy(copyId): Copy` is synchronous, as in the spec.
6. **`changeOwner` does not modify `holderUserId`.** Owner and holder are independent (rule 8). If a transfer also changes who holds the copy, Service II must also call `changeHolder`.
7. **`POST /copy` does not accept `holderUserId`:** when a copy is created, the holder is always the owner.
8. **Repeated authors in `authorIds`:** they are stored only once (`[1, 1]` → one author).
9. **`year`:** must be an integer between 1 and the current year.
10. **IDs:** random integers between 1 and 10⁹, with no repeats within each collection. They follow the project's `Math.random()` convention, like `user-management`. Before, some modules used unrounded `Math.random()` (`0.1234...`), and those ids could not be passed in the URL.
11. **Creation responses return only the id** (`{ authorId }`, etc.), as the spec asks. Before, `create` for author and work returned nothing.

## Testing

### How it was tested

1. **Static checks:** `tsc --noEmit`, `npm run lint` and `npm run build`.
2. **Existing unit tests:** `npm test`, with the scaffold `*.spec.ts` files. Only the providers that are now needed were adjusted.
3. **End-to-end HTTP tests:**
   - Both compiled services were started: `user-management` on port 3001 and `copy-management` on 3100, with `USER_MANAGEMENT_URL=http://localhost:3001`.
   - A bash script with `curl` ran 72 checks. Each one checks the HTTP code and, when relevant, the response content.
   - The test users (**U1** and **U2**) were created with `POST /user` in `user-management`.
   - The script was not saved in the repo, due to the "Do not generate tests" restriction. It can be reproduced by hand with the table below.
4. **User service down:** `user-management` was stopped and `POST /copy` was called.

#### Note about the environment

As already documented in `user-management`, the repo's `node_modules` is in `~/Documents`, which is synced with iCloud. In this pass, `tsc` and `oxlint` ran fine from the repo, but `npm run build` + `npm test` were extremely slow: the run did finish, but Jest alone took 523 s, with the same result (13/15, only the `book` specs fail). For faster testing, `src/`, `test/` and the config files of both services were copied to a temporary folder and `npm ci` was run with the same `package-lock.json`: same versions, same code.

That build ran on the repo, so it regenerated `dist/` and `tsconfig.build.tsbuildinfo`. Neither of them is edited by hand: they are regenerated with `npm run build`. Also, `git status` shows `tsconfig.build 3.tsbuildinfo` and `tsconfig.build 4.tsbuildinfo` as deleted, which are iCloud duplicates. It is not known whether they were already missing before these changes. They are not needed.

### Results

| Check | Before the changes | After |
| --- | --- | --- |
| `tsc --noEmit` | ✅ | ✅ |
| `npm run lint` | — | ✅ 0 errors, 4 warnings (all in `book`/`publisher`/`update-author.dto.ts`, which are unused) |
| `npm run build` | — | ✅ |
| `npm test` | ❌ 0/15 suites (`TS5011`, no test got to run) | ✅ 13/15. Only the 2 `book` specs fail (unused module, see below) |
| HTTP tests | — (the edition and copy endpoints returned placeholder strings) | ✅ 72/72 |
| `user-management` down | — | ✅ `503 user-management is unreachable`, and the copy is not created |

The 2 `book` specs fail because of a problem the scaffold already had: they register `BookService` without `AuthorService` or `GenreService`. It was not visible before, because no test got to run. It goes away when `src/book/` is deleted.

### Problems found and changes made

1. **`npm test` failed with `TS5011`**, because TypeScript 6 requires `rootDir`. **Change:** `"rootDir": "./"` was added to `tsconfig.json`. The build is not affected, because `tsconfig.build.json` sets its own `rootDir`.
2. **Then it failed with `Must use import to load ES Module`,** because `@nestjs/testing` v12 is an ESM-only package. **Change:** `test`, `test:watch`, `test:cov` and `test:e2e` now run `node --experimental-vm-modules node_modules/jest/bin/jest.js`. Node shows an `ExperimentalWarning`, which is expected.
3. **During the work, `package.json` was accidentally overwritten** with the contents of `tsconfig.json` (a `cp` with an empty variable). It was restored from `HEAD`, which matches the content it had before the changes, and then the change from point 2 was applied again. The final `git diff` of `package.json` is only those 4 lines.

All HTTP tests passed on the first run with the final code, so no code had to be fixed because of them.

### HTTP test details

`{A1}`, `{A2}`, `{W1}`, `{W2}`, `{E1}`, `{C1}` are the ids returned by the earlier creations. **U1** and **U2** are the `user-management` users. Id `1` is used as a nonexistent id.

#### Authors

| ID | Case | Request | Expected | Got |
|---|---|---|---|---|
| A01 | Create author (A1) | `POST /author` `{"name":"Jorge","lastName":"Borges","nationality":"Argentina","countryOfResidence":"Suiza"}` | 201 | ✅ 201 |
| A01b | The response is only an integer `{ authorId }` | — | — | ✅ |
| A02 | Create second author (A2) | `POST /author` `{"name":"Adolfo","lastName":"Bioy Casares",...}` | 201 | ✅ 201 |
| A03 | Missing `countryOfResidence` | `POST /author` `{"name":"X","lastName":"Y","nationality":"Z"}` | 400 | ✅ 400 |
| A04 | Blank `name` | `POST /author` `{"name":"  ",...}` | 400 | ✅ 400 |
| A05 | `nationality` is not a string | `POST /author` `{...,"nationality":5,...}` | 400 | ✅ 400 |
| A06 | Unknown field | `POST /author` `{...,"foo":1}` | 400 | ✅ 400 |
| A07 | No body | `POST /author` | 400 | ✅ 400 |
| A08 | Get author (+ correct data) | `GET /author/{A1}` | 200 | ✅ 200 |
| A09 | Nonexistent author | `GET /author/1` | 404 | ✅ 404 |
| A10 | Non-numeric id | `GET /author/abc` | 400 | ✅ 400 |
| A11 | List: there are exactly 2 authors | `GET /author` | 200 | ✅ 200 |

#### Works

| ID | Case | Request | Expected | Got |
|---|---|---|---|---|
| W01 | Create work with 2 authors (W1), response `{ workId }` | `POST /work` `{"title":"Ficciones","genre":"Cuento","authorIds":[{A1},{A2}]}` | 201 | ✅ 201 |
| W02 | Empty `authorIds` | `POST /work` `{"title":"T","genre":"G","authorIds":[]}` | 400 | ✅ 400 |
| W03 | No `authorIds` | `POST /work` `{"title":"T","genre":"G"}` | 400 | ✅ 400 |
| W04 | One of the authors does not exist | `POST /work` `{...,"authorIds":[{A1},1]}` | 404 | ✅ 404 |
| W05 | `authorIds` with non-integer values | `POST /work` `{...,"authorIds":["x"]}` | 400 | ✅ 400 |
| W06 | Missing `title` | `POST /work` `{"genre":"G","authorIds":[{A1}]}` | 400 | ✅ 400 |
| W07 | Missing `genre` | `POST /work` `{"title":"T","authorIds":[{A1}]}` | 400 | ✅ 400 |
| W08 | Repeated author (W2) | `POST /work` `{"title":"El Aleph","genre":"Cuento","authorIds":[{A1},{A1}]}` | 201 | ✅ 201 |
| W09 | Get work: title, genre and 2 full authors | `GET /work/{W1}` | 200 | ✅ 200 |
| W10 | The work with a repeated author has only 1 author | `GET /work/{W2}` | 200 | ✅ 200 |
| W11 | Nonexistent work | `GET /work/1` | 404 | ✅ 404 |
| W12 | The failed attempts did not create works (there are 2) | `GET /work` | 200 | ✅ 200 |

#### Editions

| ID | Case | Request | Expected | Got |
|---|---|---|---|---|
| E01 | Create edition (E1), response `{ editionId }` | `POST /edition` `{"workId":{W1},"publisher":"Sur","year":1944}` | 201 | ✅ 201 |
| E02 | Second edition of the same work | `POST /edition` `{"workId":{W1},"publisher":"Emecé","year":1956}` | 201 | ✅ 201 |
| E03 | The work does not exist | `POST /edition` `{"workId":1,...}` | 404 | ✅ 404 |
| E04 | Missing `publisher` | `POST /edition` `{"workId":{W1},"year":1944}` | 400 | ✅ 400 |
| E05 | Missing `year` | `POST /edition` `{"workId":{W1},"publisher":"Sur"}` | 400 | ✅ 400 |
| E06 | Non-integer `year` | `{...,"year":1944.5}` | 400 | ✅ 400 |
| E07 | `year` as a string | `{...,"year":"1944"}` | 400 | ✅ 400 |
| E08 | `year` in the future | `{...,"year":3000}` | 400 | ✅ 400 |
| E09 | `workId` as a string | `{"workId":"{W1}",...}` | 400 | ✅ 400 |
| E10 | Get edition (correct data) | `GET /edition/{E1}` | 200 | ✅ 200 |
| E11 | Nonexistent edition | `GET /edition/1` | 404 | ✅ 404 |

#### Copies

| ID | Case | Request | Expected | Got |
|---|---|---|---|---|
| C01 | Create copy (C1), response `{ copyId }` | `POST /copy` `{"editionId":{E1},"ownerUserId":U1}` | 201 | ✅ 201 |
| C02 | Get: `ownerUserId` = `holderUserId` = U1 | `GET /copy/{C1}` | 200 | ✅ 200 |
| C03 | The edition does not exist | `POST /copy` `{"editionId":1,"ownerUserId":U1}` | 404 | ✅ 404 |
| C04 | The user does not exist in `user-management` | `POST /copy` `{"editionId":{E1},"ownerUserId":1}` | 404 | ✅ 404 |
| C05 | Missing `ownerUserId` | `POST /copy` `{"editionId":{E1}}` | 400 | ✅ 400 |
| C06 | Negative `ownerUserId` | `{...,"ownerUserId":-3}` | 400 | ✅ 400 |
| C07 | `holderUserId` is sent (not allowed) | `{...,"holderUserId":U2}` | 400 | ✅ 400 |
| C08 | Nonexistent copy | `GET /copy/1` | 404 | ✅ 404 |
| C09 | The failed attempts did not create copies (there is 1) | `GET /copy` | 200 | ✅ 200 |

#### Service II operations

| ID | Case | Request | Expected | Got |
|---|---|---|---|---|
| S01 | Loan: `changeHolder` → owner U1, holder U2 | `PATCH /copy/{C1}/holder` `{"newHolderUserId":U2}` | 200 | ✅ 200 |
| S02 | Return: `changeHolder` | `PATCH /copy/{C1}/holder` `{"newHolderUserId":U1}` | 200 | ✅ 200 |
| S03 | Transfer: `changeOwner` → owner U2, holder stays U1 | `PATCH /copy/{C1}/owner` `{"newOwnerUserId":U2}` | 200 | ✅ 200 |
| S04 | The new owner does not exist | `PATCH /copy/{C1}/owner` `{"newOwnerUserId":1}` | 404 | ✅ 404 |
| S05 | The copy does not exist | `PATCH /copy/1/holder` `{"newHolderUserId":U1}` | 404 | ✅ 404 |
| S06 | No body | `PATCH /copy/{C1}/owner` | 400 | ✅ 400 |
| S07 | Invalid user id | `PATCH /copy/{C1}/holder` `{"newHolderUserId":"x"}` | 400 | ✅ 400 |
| S08 | Unknown field | `PATCH /copy/{C1}/owner` `{"newOwnerUserId":U1,"x":1}` | 400 | ✅ 400 |
| S09 | The failed attempts did not modify the copy (owner U2, holder U1) | `GET /copy/{C1}` | 200 | ✅ 200 |

#### Removed routes

| ID | Request | Expected | Got |
|---|---|---|---|
| R01 | `GET /book` | 404 | ✅ 404 |
| R02 | `GET /genre` | 404 | ✅ 404 |
| R03 | `GET /publisher` | 404 | ✅ 404 |

## How to run both services together

```sh
cd user-management && PORT=3001 npm run start:dev
cd copy-management && PORT=3000 npm run start:dev   # USER_MANAGEMENT_URL defaults to http://localhost:3001
```
