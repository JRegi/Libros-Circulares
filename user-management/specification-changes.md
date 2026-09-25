# Changes applied according to `specification.md`

This document summarizes everything that was implemented in `user-management` based on `specification.md`, and the decisions made where the specification was not enough to decide. We were explicitly asked not to ask questions, so every decision of that kind is marked as **Decision** so it can be reviewed.

## Modified / created files

| File | Status |
| --- | --- |
| `src/app.module.ts` | Modified: imports `UserModule` and `CommunityModule` (before, `UserModule` was not registered, so its endpoints did not exist). |
| `src/user/entities/user.entity.ts` | Modified: entity according to the spec + `contactUserId`. |
| `src/user/dto/create-user.dto.ts` | Modified: registration fields. |
| `src/user/dto/update-user.dto.ts` | Rewritten without `@nestjs/mapped-types`. |
| `src/user/user.service.ts` | Rewritten: real in-memory logic. |
| `src/user/user.controller.ts` | Modified: `ParseIntPipe` and `GET /user/:id/contact` endpoint. |
| `src/user/user.module.ts` | Modified: exports `UserService`. |
| `src/community/**` | New module: entity, DTO, service, controller, module. |
| `tsconfig.json` | Modified: `"rootDir": "./"` (without it Jest did not compile with TypeScript 6; see [Testing](#testing)). |
| `package.json` | Modified: the `test`, `test:watch`, `test:cov` and `test:e2e` scripts run Jest with `--experimental-vm-modules` (see [Testing](#testing)). |
| `specification-changes.md` | This file. |

Nothing outside `user-management/` was touched, no dependencies were added, and no new test files were written in the repo (the spec forbids it). The existing scaffold `*.spec.ts` files were not modified.

## Entities

### `User`

Same as the spec, plus one field:

```typescript
contactUserId?: number; // userId of the user whose contact is used
```

**Decision:** the spec says that "a user's contact can be a reference to another user's contact, and it is mandatory if the user is a minor", but the spec's `User` class has nowhere to store that reference. `contactUserId` (an id, not the `User` object) was added as the minimal way to represent it.

### `Community`

Exactly as in the spec (`communityId`, `name`, `members: User[] = []`).

The user–community relationship is bidirectional with object references (`user.communities` / `community.members`), and the service keeps both sides in sync.

**Decision:** since those references are circular, returning the entities as-is would break `JSON.stringify`. That is why the `GET`s return a view:

- user → `communities: [{ communityId, name }]`
- community → `members: [{ userId, name, lastName }]`

## Endpoints

### Users (`/user`)

| Method | Route | Description | Success |
| --- | --- | --- | --- |
| POST | `/user` | Register user | `201` `{ userId }` |
| GET | `/user` | List users | `200` |
| GET | `/user/:id` | Get user | `200` |
| GET | `/user/:id/contact` | User's effective contact | `200` `{ email, phone, contactUserId? }` |
| PATCH | `/user/:id` | Modify parameters (except the ID) | `200` `{ message }` |
| DELETE | `/user/:id` | Deregister | `200` `{ message }` |

`GET /user` and `GET /user/:id` already existed in the scaffold and were kept.

**Decision:** `GET /user/:id/contact` was added because the spec includes "contact information management" in scope. It returns the user's own email/phone or, if they have a `contactUserId`, those of the referenced user. The rest of that management (changing email, phone or reference) is done with `PATCH`.

### Communities (`/community`)

| Method | Route | Description | Success |
| --- | --- | --- | --- |
| POST | `/community` | Create community `{ name }` | `201` `{ communityId }` |
| GET | `/community` | List communities | `200` |
| GET | `/community/:id` | Get community | `200` |
| DELETE | `/community/:id` | Delete community | `200` `{ message }` |
| POST | `/community/:id/members/:userId` | Add user to the community | `201` `{ message }` |
| DELETE | `/community/:id/members/:userId` | Remove user from the community | `200` `{ message }` |

**Decision:** the spec says "HTTP Request: CREATE" for creating a community, but that HTTP method does not exist. `POST` was used.

**Decision:** the spec only details the creation flow, but the scope includes "deleting communities" and "managing users within a community", so the `DELETE` and the member endpoints were implemented. No `PATCH` was added for communities because the spec does not ask for it.

The spec says communities are managed by the devs. There is no authentication in the project, so that is not enforced in code: the community endpoints are open.

## Implemented business rules

### Registration (`POST /user`)

- Required: `name`, `lastName`, `email`, `birthDate`, `dni`.
- Optional: `phone`, `contactUserId` (`null` is the same as not sending it).
- Validations (`400 Bad Request` if they fail):
  - `name`, `lastName`: non-empty strings (spaces are trimmed).
  - `email`: basic format `something@domain.tld`.
  - `birthDate`: string with the exact format `YYYY-MM-DD` (e.g. `"2001-05-23"`), which must be a real calendar date (`2001-02-30` is rejected) and not in the future. It is stored as UTC midnight of that day.
  - `dni`, `phone`: positive integers.
  - Fields not in the DTO (e.g. `userId`, `communities`) → `400` ("Unknown fields: ...").
- DNI already in use → `409 Conflict` (conflict case from the spec).
- Minor without `contactUserId` → `400`.
- Response: `{ userId }`.

**Decision:** `phone` is in the entity but not in the spec's registration input, so it was accepted as optional on registration and can be set or changed later with `PATCH`.

**Decision:** minor = under 18 years old (age of majority in Argentina), calculated against the server's current local date. Someone who turns 18 today is already an adult.

**Decision:** validation is done manually in the service because `class-validator` is not a project dependency and the spec forbids adding dependencies.

### Contact reference (`contactUserId`)

Validated on registration and on `PATCH`:

- The referenced user must exist (`404` if not).
- It cannot be the user themself (`400`).
- **Decision:** the referenced user must have their own contact (they cannot reference someone else). This prevents chains and cycles of references (`400`).
- **Decision:** if the user is a minor, the referenced user must be an adult (`400`).

### ID generation

"A userId must be generated successfully": IDs are generated with `Math.random()` (repo convention) and retried until one that is not in use is obtained.

**Decision:** the result is converted to an integer (`1..1_000_000_000`) so that IDs are practical in URLs and can be parsed with `ParseIntPipe`. The same applies to `communityId`.

### Modification (`PATCH /user/:id`)

- Any DTO field can be changed: `name`, `lastName`, `email`, `birthDate`, `dni`, `phone`, `contactUserId`.
- Sending `userId` in the body → `400` ("userId cannot be changed").
- Empty body → `400`.
- Fields not in the DTO → `400`, even if they come together with valid fields (in that case nothing is applied).
- `birthDate` follows the same rules as on registration.
- Changing to a DNI already used by another user → `409` (conflict case from the spec).
- `contactUserId: null` removes the reference, but only if the user is an adult.
- A minor cannot be left without a reference, including when changing `birthDate` (`400`).
- **Decision:** if the user is the contact reference of others, they cannot start referencing someone (`409`). Since a minor is required to have a reference, this also prevents that user from becoming a minor. If they try by changing `birthDate`, they get the `400` "a minor must have a reference".
- Everything is validated first and then the changes are applied: if something fails, nothing is modified.
- **Decision:** `UpdateUserDto` was written by hand with optional fields instead of `PartialType(CreateUserDto)`, because `@nestjs/mapped-types` is not installed (the project did not compile) and no dependencies were to be added.

### Deregistration (`DELETE /user/:id`)

- The user must exist (`404`).
- **Decision:** if another user uses them as a contact reference → `409`. Those users' contact must be changed first. Otherwise a minor could be left without a contact.
- The user is removed from all their communities and then deleted.
- **Pending:** the spec requires that "all operations are closed successfully" before deregistration. `operation-management` does not yet have modules or a concept of operation, so that validation cannot be done. A `TODO` was left in `UserService.remove`.

### Communities

- Create: `name` non-empty string (`400`). Other fields in the body → `400`. **Decision:** the name is not required to be unique, because the spec does not ask for it.
- Delete: the community is removed from each member's `communities` and then deleted.
- Add member:
  - The community or the user does not exist → `404`.
  - The user is already a member → `409`.
  - The user is already in 3 communities → `409` (spec limit).
- Remove member: the user is not a member → `404`.

### IDs in routes

**Decision:** the `:id` / `:userId` parameters use `ParseIntPipe` (from `@nestjs/common`) instead of `+id`. A non-numeric id returns `400` instead of a confusing `404`.

## Things from the spec that were not implemented (and why)

- **"Operations can only happen between members of the same community"**: this is an operations rule, and the spec says that belongs to `operation-management`. No endpoint was added for this. When that service exists, it can call `GET /user/:id` and compare both users' `communities`.
- **Requiring closed operations before deregistration**: see "Pending" above.
- **Test files in the repo**: the spec says "Do not generate tests". The tests below were done with a script outside the repo.

## Testing

### How it was tested

1. **Static checks:** `tsc --noEmit`, `npm run lint` and `npm run build`.
2. **Existing unit tests:** `npm test`, with the 3 scaffold `*.spec.ts` files.
3. **End-to-end HTTP tests:** the compiled service was started (`node dist/main.js`, port 3107) and a bash script with `curl` ran 122 checks. Each one checks the HTTP status code and, when relevant, the response content. The script was not saved in the repo due to the "Do not generate tests" restriction, but the table below has every request with its body, so it can be reproduced by hand. In the table, `{A}`, `{B}`, `{K}`, etc. are the ids returned by earlier registrations; `{TOMORROW}` and `{TURNS18_TODAY}`/`{TURNS18_TOMORROW}` are dates computed on the day of the test.

The HTTP tests were run with the machine's time zone (`America/Argentina/Buenos_Aires`, UTC-3) and repeated with `TZ=UTC` and `TZ=Asia/Tokyo` (UTC+9), to rule out time zone bugs. All three runs gave 122 out of 122.

#### Note about the environment

On this machine, the project's `node_modules` is in `~/Documents`, which is synced with iCloud: 13,237 of the 16,477 files were iCloud placeholders with no downloaded content. Reading them gave `ETIMEDOUT`, so neither the server nor Jest could start from the repo folder. For testing, `src/`, `test/` and the config files were copied to a temporary folder and `npm ci` was run with the same `package-lock.json`. It is the same code with the same dependency versions, and the changes were made in the repo and copied again before each run. To work normally on this machine, move the repo out of `~/Documents`, or mark the folder as "Keep Downloaded" in Finder and run `npm ci` again.

### Results

| Check | Before the changes | After |
| --- | --- | --- |
| `tsc --noEmit` | ✅ | ✅ |
| `npm run lint` | ✅ | ✅ |
| `npm run build` | ✅ | ✅ |
| `npm test` | ❌ 0/3 suites (no test got to run) | ✅ 3/3 suites, 3/3 tests |
| HTTP tests | ❌ 96 ok, 13 failures (out of 109 checks; 13 more were added later) | ✅ 122/122 (also with `TZ=UTC` and `TZ=Asia/Tokyo`) |

### Problems found and changes made

#### Project configuration (already broken in the scaffold)

1. **`npm test` failed with `TS5011`** (TypeScript 6 requires an explicit `rootDir`), even on `app.controller.spec.ts`, which was not touched. `tsconfig.build.json` already sets `rootDir: ./src` for the build, but `tsconfig.json`, which is the one `ts-jest` uses, does not. **Change:** `"rootDir": "./"` was added to `tsconfig.json`. The build is not affected because `tsconfig.build.json` overrides it.
2. **Then, `npm test` failed with `Must use import to load ES Module: .../@nestjs/testing/index.js`.** `@nestjs/testing` v12 is published only as an ES module. Jest 30 can load it with `require()` on Node ≥ 24.9, but only if Node has `vm.SourceTextModule`, which only exists with the `--experimental-vm-modules` flag. **Change:** the `test`, `test:watch`, `test:cov` and `test:e2e` scripts in `package.json` now run `node --experimental-vm-modules node_modules/jest/bin/jest.js`. It also works on Windows (it does not use inline environment variables). Node shows an `ExperimentalWarning`, which is expected. `test:debug` was not changed.

#### Code (found by the HTTP tests)

| Test | Problem | Change |
| --- | --- | --- |
| U09, U10 | `birthDate` used `new Date(string)`, which is very permissive: `"1"` was accepted as 2001-01-01 and `"2001-02-30"` silently rolled over to March 2. | The `YYYY-MM-DD` format is required with a regular expression, the date is built with `Date.UTC`, and it is verified that year, month and day did not change. New tests: U25 (with time → 400), U26 (Feb 29 leap year → 201) and P25 (Feb 29 non-leap year → 400). |
| U22 | **Time zone bug:** the date is stored as UTC midnight, but `isMinor` read it with local `getDate()`. In Argentina, `"2008-09-25"` was read as the 24th, so someone who turns 18 **tomorrow** was considered an adult **today** and could register without a contact. | `isMinor` reads the birth date with `getUTC*()`, and the "future date" comparison uses the local calendar day. New test: U28 (the stored `birthDate` keeps the day). |
| U23 | In `PATCH`, `contactUserId: null` means "no reference", but on registration it gave `400`. It was inconsistent. | On registration, `null` is treated the same as not sending the field. The DTO now accepts `number \| null`. |
| P08 | A `PATCH` with only unknown fields (`{"foo":"bar"}`) answered `200 "User updated"` without changing anything. A typo in a field name went unnoticed. | Fields not in the DTO are rejected with `400` ("Unknown fields: foo"), in `PATCH` and in user and community registration. New tests: U24, P26 and C07b. |
| P16 | The test expected `409`, but got `400`. On review, the check "a minor's contact cannot become a minor" (`409`) was **unreachable code**: a user who is someone's contact cannot have a contact, and a minor must have one, so the `400` always fires first. | The dead check was removed and a comment was left explaining why the invariant still holds. The test expectation was corrected to `400`. |
| Q01b, P20, P21, X01, X05b, X06, X07 | Not bugs of their own. They failed in cascade because U09 created an extra user and U23 did not create user `N`, which those tests use. | None: they passed on their own after fixing U09 and U23. |

**Decision** made because of these changes: `birthDate` no longer accepts dates with a time (`"2001-05-23T10:00:00Z"`), only `YYYY-MM-DD`. A birth date does not need a time, and this avoids time zone ambiguity.

### HTTP test details (final run)

Test users: **A** (adult, contact of minors), **B** (adult), **K** (minor, contact A), **N** (adult who later becomes a minor), **R** (adult who reuses a freed DNI), **E18** (turns 18 today), **LEAP** (born 2000-02-29) and **BABY** (born today). Communities: **C1** to **C4**.

#### Users: registration (`POST /user`)

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| U01 | Register adult (A) | `POST /user` `{"name":"Ana","lastName":"Pérez","email":"ana@mail.com","birthDate":"1990-03-15","dni":30111222,"phone":1144445555}` | 201 | 201 | ✅ |
| U01b | The response is only an integer { userId } | (checks the previous response body) | — | — | ✅ |
| U02 | Register second adult (B) | `POST /user` `{"name":"Beto","lastName":"Gómez","email":"beto@mail.com","birthDate":"1985-07-01","dni":28999888}` | 201 | 201 | ✅ |
| U03 | Duplicate DNI | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":30111222}` | 409 | 409 | ✅ |
| U04 | Missing name | `POST /user` `{"lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":1001}` | 400 | 400 | ✅ |
| U05 | Blank lastName | `POST /user` `{"name":"X","lastName":"   ","email":"x@mail.com","birthDate":"1990-01-01","dni":1001}` | 400 | 400 | ✅ |
| U06 | Invalid email | `POST /user` `{"name":"X","lastName":"Y","email":"not-an-email","birthDate":"1990-01-01","dni":1001}` | 400 | 400 | ✅ |
| U07 | Unparseable birthDate ("abc") | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"abc","dni":1001}` | 400 | 400 | ✅ |
| U08 | birthDate in the future (tomorrow) | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"{TOMORROW}","dni":1001}` | 400 | 400 | ✅ |
| U09 | birthDate not in YYYY-MM-DD ("1") | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1","dni":1001}` | 400 | 400 | ✅ |
| U10 | Impossible calendar date (2001-02-30) | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"2001-02-30","dni":1001}` | 400 | 400 | ✅ |
| U11 | dni as string | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":"1001"}` | 400 | 400 | ✅ |
| U12 | Negative dni | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":-5}` | 400 | 400 | ✅ |
| U13 | Decimal dni | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":10.5}` | 400 | 400 | ✅ |
| U14 | phone as string | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":1001,"phone":"11-4444"}` | 400 | 400 | ✅ |
| U15 | Empty body | `POST /user` `{}` | 400 | 400 | ✅ |
| U16 | Minor without contactUserId | `POST /user` `{"name":"Kid","lastName":"Pérez","email":"kid@mail.com","birthDate":"2015-06-10","dni":55000111}` | 400 | 400 | ✅ |
| U17 | Minor with nonexistent contact | `POST /user` `{"name":"Kid","lastName":"Pérez","email":"kid@mail.com","birthDate":"2015-06-10","dni":55000111,"contactUserId":123}` | 404 | 404 | ✅ |
| U18 | Minor (K) with adult contact A | `POST /user` `{"name":"Kid","lastName":"Pérez","email":"kid@mail.com","birthDate":"2015-06-10","dni":55000111,"contactUserId":{A}}` | 201 | 201 | ✅ |
| U19 | Minor whose contact is another minor | `POST /user` `{"name":"Kid2","lastName":"P","email":"k2@mail.com","birthDate":"2016-01-01","dni":55000222,"contactUserId":{K}}` | 400 | 400 | ✅ |
| U20 | Adult whose contact itself uses a reference (chain) | `POST /user` `{"name":"C","lastName":"D","email":"c@mail.com","birthDate":"1980-01-01","dni":20000333,"contactUserId":{K}}` | 400 | 400 | ✅ |
| U21 | Turns 18 today → adult, no contact needed | `POST /user` `{"name":"Eighteen","lastName":"Today","email":"e18@mail.com","birthDate":"{TURNS18_TODAY}","dni":40000001}` | 201 | 201 | ✅ |
| U22 | Turns 18 tomorrow → minor, contact required | `POST /user` `{"name":"Eighteen","lastName":"Tomorrow","email":"e18b@mail.com","birthDate":"{TURNS18_TOMORROW}","dni":40000002}` | 400 | 400 | ✅ |
| U23 | Adult with null contactUserId (N) | `POST /user` `{"name":"Nulo","lastName":"Contacto","email":"nulo@mail.com","birthDate":"1970-01-01","dni":17000001,"contactUserId":null}` | 201 | 201 | ✅ |
| U24 | Unknown field in the body | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01","dni":1002,"communities":[]}` | 400 | 400 | ✅ |
| U25 | birthDate with time | `POST /user` `{"name":"X","lastName":"Y","email":"x@mail.com","birthDate":"1990-01-01T10:00:00Z","dni":1002}` | 400 | 400 | ✅ |
| U26 | Feb 29 of a leap year (2000-02-29) is valid | `POST /user` `{"name":"Leap","lastName":"Day","email":"leap@mail.com","birthDate":"2000-02-29","dni":1003}` | 201 | 201 | ✅ |
| U27 | birthDate = today is valid (newborn, with contact) | `POST /user` `{"name":"Baby","lastName":"New","email":"baby@mail.com","birthDate":"{TODAY}","dni":1004,"contactUserId":{A}}` | 201 | 201 | ✅ |
| U28 | The stored birthDate keeps the calendar day | `GET /user/{E18}` | 200 | 200 | ✅ |
| U28b | birthDate is exactly 18 years ago | (checks the previous response body) | — | — | ✅ |

#### Users: queries

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| Q01 | List users | `GET /user` | 200 | 200 | ✅ |
| Q01b | The list has 7 users | (checks the previous response body) | — | — | ✅ |
| Q02 | Get user A | `GET /user/{A}` | 200 | 200 | ✅ |
| Q02b | The view has the spec fields and empty communities | (checks the previous response body) | — | — | ✅ |
| Q03 | Nonexistent user | `GET /user/999` | 404 | 404 | ✅ |
| Q04 | Non-numeric id | `GET /user/abc` | 400 | 400 | ✅ |
| Q05 | Adult A's contact = their own data | `GET /user/{A}/contact` | 200 | 200 | ✅ |
| Q05b | Own email/phone, no contactUserId | (checks the previous response body) | — | — | ✅ |
| Q06 | Minor K's contact = A's data | `GET /user/{K}/contact` | 200 | 200 | ✅ |
| Q06b | Resolved to A | (checks the previous response body) | — | — | ✅ |
| Q07 | Contact of nonexistent user | `GET /user/999/contact` | 404 | 404 | ✅ |

#### Users: modification (`PATCH /user/:id`)

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| P01 | Change name | `PATCH /user/{B}` `{"name":"Roberto"}` | 200 | 200 | ✅ |
| P01b | Verify the change | `GET /user/{B}` | 200 | 200 | ✅ |
| P01c | name is Roberto | (checks the previous response body) | — | — | ✅ |
| P02 | Change DNI to one in use | `PATCH /user/{B}` `{"dni":30111222}` | 409 | 409 | ✅ |
| P03 | Set their own current DNI | `PATCH /user/{B}` `{"dni":28999888}` | 200 | 200 | ✅ |
| P04 | Change DNI to a free one | `PATCH /user/{B}` `{"dni":28999889}` | 200 | 200 | ✅ |
| P05 | The previous DNI becomes free (R registers with it) | `POST /user` `{"name":"Reuse","lastName":"Dni","email":"r@mail.com","birthDate":"1990-01-01","dni":28999888}` | 201 | 201 | ✅ |
| P06 | Try to change userId | `PATCH /user/{B}` `{"userId":5}` | 400 | 400 | ✅ |
| P07 | Empty body | `PATCH /user/{B}` `{}` | 400 | 400 | ✅ |
| P08 | Only unknown fields | `PATCH /user/{B}` `{"foo":"bar"}` | 400 | 400 | ✅ |
| P09 | Invalid email | `PATCH /user/{B}` `{"email":"bad"}` | 400 | 400 | ✅ |
| P10 | Atomicity: valid name + invalid email | `PATCH /user/{B}` `{"name":"ShouldNotApply","email":"bad"}` | 400 | 400 | ✅ |
| P10b | name unchanged after the failed PATCH | `GET /user/{B}` | 200 | 200 | ✅ |
| P10c | name is still Roberto | (checks the previous response body) | — | — | ✅ |
| P11 | Add phone | `PATCH /user/{B}` `{"phone":1155556666}` | 200 | 200 | ✅ |
| P12 | phone as string | `PATCH /user/{B}` `{"phone":"abc"}` | 400 | 400 | ✅ |
| P13 | Minor removes their contact | `PATCH /user/{K}` `{"contactUserId":null}` | 400 | 400 | ✅ |
| P14 | Adult references themself | `PATCH /user/{B}` `{"contactUserId":{B}}` | 400 | 400 | ✅ |
| P15 | A (contact of minors) starts referencing B | `PATCH /user/{A}` `{"contactUserId":{B}}` | 409 | 409 | ✅ |
| P16 | A (contact of minors) becomes a minor | `PATCH /user/{A}` `{"birthDate":"2012-01-01"}` | 400 | 400 | ✅ |
| P17 | Minor K changes their contact to B | `PATCH /user/{K}` `{"contactUserId":{B}}` | 200 | 200 | ✅ |
| P17b | K's contact now resolves to B | `GET /user/{K}/contact` | 200 | 200 | ✅ |
| P17c | B's email | (checks the previous response body) | — | — | ✅ |
| P18 | Adult R references B | `PATCH /user/{R}` `{"contactUserId":{B}}` | 200 | 200 | ✅ |
| P19 | Adult R removes their contact | `PATCH /user/{R}` `{"contactUserId":null}` | 200 | 200 | ✅ |
| P20 | Adult becomes a minor without contact | `PATCH /user/{N}` `{"birthDate":"2014-01-01"}` | 400 | 400 | ✅ |
| P21 | Adult becomes a minor with contact in the same PATCH | `PATCH /user/{N}` `{"birthDate":"2014-01-01","contactUserId":{B}}` | 200 | 200 | ✅ |
| P22 | K becomes an adult and removes the contact in the same PATCH | `PATCH /user/{K}` `{"birthDate":"2000-01-01","contactUserId":null}` | 200 | 200 | ✅ |
| P23 | Nonexistent user | `PATCH /user/999` `{"name":"X"}` | 404 | 404 | ✅ |
| P24 | birthDate in the future | `PATCH /user/{B}` `{"birthDate":"{TOMORROW}"}` | 400 | 400 | ✅ |
| P25 | Feb 29 of a non-leap year (2001-02-29) | `PATCH /user/{B}` `{"birthDate":"2001-02-29"}` | 400 | 400 | ✅ |
| P26 | Unknown field together with a valid one | `PATCH /user/{B}` `{"name":"Nope","foo":1}` | 400 | 400 | ✅ |
| P26b | name unchanged | `GET /user/{B}` | 200 | 200 | ✅ |
| P26c | name is still Roberto | (checks the previous response body) | — | — | ✅ |

#### Communities

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| C01 | Create community C1 | `POST /community` `{"name":"Lectores Palermo"}` | 201 | 201 | ✅ |
| C01b | The response is only an integer { communityId } | (checks the previous response body) | — | — | ✅ |
| C02 | Create C2 | `POST /community` `{"name":"Club Belgrano"}` | 201 | 201 | ✅ |
| C03 | Create C3 | `POST /community` `{"name":"Caballito Lee"}` | 201 | 201 | ✅ |
| C04 | Create C4 | `POST /community` `{"name":"Almagro Libros"}` | 201 | 201 | ✅ |
| C05 | Missing name | `POST /community` `{}` | 400 | 400 | ✅ |
| C06 | Blank name | `POST /community` `{"name":"  "}` | 400 | 400 | ✅ |
| C07 | name is not a string | `POST /community` `{"name":5}` | 400 | 400 | ✅ |
| C07b | Unknown field | `POST /community` `{"name":"Z","members":[]}` | 400 | 400 | ✅ |
| C08 | List communities | `GET /community` | 200 | 200 | ✅ |
| C08b | There are 4 communities | (checks the previous response body) | — | — | ✅ |
| C09 | Get C1 | `GET /community/{C1}` | 200 | 200 | ✅ |
| C09b | No members | (checks the previous response body) | — | — | ✅ |
| C10 | Nonexistent community | `GET /community/999` | 404 | 404 | ✅ |
| C11 | Non-numeric id | `GET /community/abc` | 400 | 400 | ✅ |

#### Community members

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| M01 | A joins C1 | `POST /community/{C1}/members/{A}` | 201 | 201 | ✅ |
| M02 | A joins C1 again | `POST /community/{C1}/members/{A}` | 409 | 409 | ✅ |
| M03 | A joins C2 | `POST /community/{C2}/members/{A}` | 201 | 201 | ✅ |
| M04 | A joins C3 | `POST /community/{C3}/members/{A}` | 201 | 201 | ✅ |
| M05 | A joins a 4th community (limit 3) | `POST /community/{C4}/members/{A}` | 409 | 409 | ✅ |
| M06 | Nonexistent user joins | `POST /community/{C1}/members/999` | 404 | 404 | ✅ |
| M07 | Join nonexistent community | `POST /community/999/members/{A}` | 404 | 404 | ✅ |
| M08 | B joins C1 | `POST /community/{C1}/members/{B}` | 201 | 201 | ✅ |
| M09 | C1 lists A and B | `GET /community/{C1}` | 200 | 200 | ✅ |
| M09b | Members = A, B | (checks the previous response body) | — | — | ✅ |
| M10 | A lists 3 communities | `GET /user/{A}` | 200 | 200 | ✅ |
| M10b | 3 communities | (checks the previous response body) | — | — | ✅ |
| M11 | A leaves C3 | `DELETE /community/{C3}/members/{A}` | 200 | 200 | ✅ |
| M12 | A leaves C3 again (not a member) | `DELETE /community/{C3}/members/{A}` | 404 | 404 | ✅ |
| M13 | Now A can join C4 | `POST /community/{C4}/members/{A}` | 201 | 201 | ✅ |
| M14 | Remove member from nonexistent community | `DELETE /community/999/members/{A}` | 404 | 404 | ✅ |

#### Community deletion

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| D01 | Delete C2 | `DELETE /community/{C2}` | 200 | 200 | ✅ |
| D02 | Delete C2 again | `DELETE /community/{C2}` | 404 | 404 | ✅ |
| D03 | A no longer lists C2 | `GET /user/{A}` | 200 | 200 | ✅ |
| D03b | Communities = C1, C4 | (checks the previous response body) | — | — | ✅ |

#### User deregistration (`DELETE /user/:id`)

| ID | Case | Request | Expected | Got | |
|---|---|---|---|---|---|
| X00 | Deregister the newborn (cleanup) | `DELETE /user/{BABY}` | 200 | 200 | ✅ |
| X00b | Deregister LEAP (cleanup) | `DELETE /user/{LEAP}` | 200 | 200 | ✅ |
| X01 | Deregister B (N's contact) | `DELETE /user/{B}` | 409 | 409 | ✅ |
| X02 | Deregister nonexistent user | `DELETE /user/999` | 404 | 404 | ✅ |
| X03 | Deregister A (member of C1 and C4) | `DELETE /user/{A}` | 200 | 200 | ✅ |
| X04 | A no longer exists | `GET /user/{A}` | 404 | 404 | ✅ |
| X05 | C1 only has B | `GET /community/{C1}` | 200 | 200 | ✅ |
| X05b | Members = B | (checks the previous response body) | — | — | ✅ |
| X06 | N stops referencing B when becoming an adult again | `PATCH /user/{N}` `{"birthDate":"1970-01-01","contactUserId":null}` | 200 | 200 | ✅ |
| X07 | Now B can be deregistered | `DELETE /user/{B}` | 200 | 200 | ✅ |
| X08 | C1 is left with no members | `GET /community/{C1}` | 200 | 200 | ✅ |
| X08b | Members empty | (checks the previous response body) | — | — | ✅ |
