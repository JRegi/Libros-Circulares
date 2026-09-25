# Changes applied according to `operation-management-specification.md`

This document summarizes everything that was done in `operation-management/` to implement the specification. It includes the decisions made where the specification was ambiguous, the environment problems that had to be solved, and the tests run with their results.

---

## 1. Summary

- The four requested operations were implemented (loan, return, ownership transfer, and copy decommission). Each one is a `POST` that returns `{ operationId }`.
- The operation history is recorded with the specification's `Operation` entity. A single optional field was added to it, `communityId` (see 2.4).
- `hasOpenOperations` was added, which the `user-management` specification asks for.
- Services I (copies) and III (communities) do not yet expose what this service needs. That is why two in-memory modules were added to stand in for them, with the interface the specification asks for (see 2.1).
- Everything is stored in memory, with no database.
- Three pre-existing project problems that prevented the tests from running were fixed (see section 5).
- Result: **54/54 unit tests and 10/10 e2e tests pass**. `npm run build` and `npm run lint` pass with no errors.

---

## 2. Decisions made

The specification left some points open. Since we were asked not to ask questions, the following was decided.

### 2.1 Dependencies on services I and III: in-memory modules inside this service

- **Service I (`copy-management`):** its `copy` module is still the Nest scaffold. Its methods return strings, and the `Copy` entity has no holder or active state.
- **Service III (communities, in `user-management`):** communities have no concept of active/inactive membership, and no service listens on another port with a queryable API.

So there was nothing to make HTTP calls against. Two local modules were created to represent those dependencies:

| Module | Represents | What it offers |
|---|---|---|
| `src/copy/` | Service I | Entity with `copyId`, `ownerUserId`, `holderUserId` and `active`, exactly what the specification asks for. Methods to look up the copy, change the holder, change the owner, and decommission. |
| `src/community/` | Service III | Memberships `{ userId, communityId, active }`, with the same shape as `CommunityMembership` in the `user-management` specification. Method `canOperateTogether(userId1, userId2, communityId)`, exactly as in the specification's example. |

`OperationService` only uses those methods. When the other services have their API, it is enough to replace the implementation of `CopyService` and `CommunityService` with HTTP clients with the same methods, without touching the operations logic.

**No file outside `operation-management/` was modified.**

### 2.2 Who can decommission a copy?

The specification says this rule must be decided. It was decided that **only the current owner can decommission the copy**:

- The copy belongs to that person, just like in the transfer (rule 6).
- **They do not need to hold the copy** (same as the transfer, rule 7). This covers, for example, a book that was lost while on loan.
- If the copy was on loan, the decommission closes that loan: the copy can no longer take part in any operation (rule 2), so it cannot remain as an open operation either.
- The decommission does not ask for `communityId`, because the specification does not include it in the input and no other user is involved.

### 2.3 Added validations the specification did not list

| Operation | Added validation | Reason |
|---|---|---|
| Ownership transfer | `fromUserId` and `toUserId` must be different (400). | Rule 8 says "to another user"; transferring something to yourself makes no sense. |
| Return | Fails with 409 if the copy is already with its owner (not on loan). | Otherwise, the owner could "return" the book to themself and an empty operation would be recorded. |
| All | IDs must be positive integers and the body cannot have unknown fields (400). | Same criterion already used by `user-management`. |

### 2.4 `communityId` field in `Operation`

`communityId?: number` was added to the entity. It is optional: the decommission does not have it. Reasons:

- Loan, return and transfer already receive it as input, so storing it costs nothing and records in which community each operation happened.
- The `user-management` specification needs to know whether a user has open operations **in a given community**, to deactivate them in it or to delete the community. Without this field that cannot be answered.

For the return, `toUserId` is filled with the owner who receives the copy (the specification leaves `toUserId` optional and says nothing for this case).

### 2.5 `hasOpenOperations` (requested by `user-management`)

The `user-management` specification says: *"The operation-management service must provide a way to check whether a user has open operations"*. It was defined like this:

- An **open operation** is an ongoing loan: an active copy that is not in its owner's hands (`holderUserId != ownerUserId`).
- It involves the **owner** and the current **holder**.
- The community of the open loan is that of the copy's last `LOAN`.
- The loan is closed by the return, by the copy's decommission, or if the holder becomes the owner through a transfer.

It is exposed as `GET /operation/open?userId=X[&communityId=Y]` and returns `{ hasOpenOperations: boolean }`.

**Known limitation:** in a loan chain A → B → C, the intermediate user B stops having the operation open as soon as they lend the copy to C.

### 2.6 Chosen HTTP codes

| Situation | Code |
|---|---|
| Invalid body or parameters, or `fromUserId == toUserId` | `400 Bad Request` |
| The user is not the holder (loan or return) or is not the owner (transfer or decommission) | `403 Forbidden` |
| The users are not active in the same community | `403 Forbidden` |
| The copy or the operation does not exist | `404 Not Found` (`NotFoundException`, repo convention) |
| The copy was decommissioned, or an attempt is made to return a copy that is not on loan | `409 Conflict` |
| Successful operation | `201 Created` with `{ operationId }` |

### 2.7 Tests (conflict with the specification)

The specification says **"Do not generate tests"**, but the explicit request for this task was to write tests to verify that everything works. That request was prioritized. If the specification must be followed to the letter, it is enough to delete the `*.spec.ts` files and `test/operation.e2e-spec.ts` listed in section 3: no production code depends on them.

---

## 3. Files

### New

| File | Contents |
|---|---|
| `src/operation/entities/operation.entity.ts` | `OperationType` enum and `Operation` class (the specification's, plus `communityId?`). |
| `src/operation/dto/create-loan.dto.ts` | `copyId`, `fromUserId`, `toUserId`, `communityId`. |
| `src/operation/dto/create-return.dto.ts` | `copyId`, `fromUserId`, `communityId`. |
| `src/operation/dto/create-ownership-transfer.dto.ts` | `copyId`, `fromUserId`, `toUserId`, `communityId`. |
| `src/operation/dto/create-decommission.dto.ts` | `copyId`, `userId`. |
| `src/operation/operation.service.ts` | Business rules for the 4 operations, history, and `hasOpenOperations`. |
| `src/operation/operation.controller.ts` | `/operation` endpoints. |
| `src/operation/operation.module.ts` | Imports `CopyModule` and `CommunityModule`. |
| `src/copy/entities/copy.entity.ts`, `dto/create-copy.dto.ts`, `copy.service.ts`, `copy.controller.ts`, `copy.module.ts` | In-memory representation of Service I (see 2.1). The module exports `CopyService`. |
| `src/community/entities/community-membership.entity.ts`, `dto/set-membership.dto.ts`, `community.service.ts`, `community.controller.ts`, `community.module.ts` | In-memory representation of Service III (see 2.1). The module exports `CommunityService`. |
| `src/common/validation.ts` | Shared helpers: positive integer validation, unknown field rejection, and ID generation with `Math.random()` (repo convention). |
| `src/operation/operation.service.spec.ts`, `src/copy/copy.service.spec.ts`, `src/community/community.service.spec.ts` | Unit tests. |
| `test/operation.e2e-spec.ts` | End-to-end HTTP tests. |
| `specification-changes.md` | This document. |

### Modified

| File | Change |
|---|---|
| `src/app.module.ts` | Imports `OperationModule`. |
| `tsconfig.json` | Added `"rootDir": "./"` (see 5.2). `tsconfig.build.json` still sets `./src`, so the `dist/` output does not change. |
| `package.json` | The `test`, `test:watch`, `test:cov` and `test:e2e` scripts run Jest with `node --experimental-vm-modules` (see 5.3). |
| `test/jest-e2e.json` | Added `"forceExit": true` (see 5.4). |

`README.md` was not touched; it already had uncommitted changes from before this task.

---

## 4. Resulting API

### Operations (what the specification asks for)

| Method | Route | Body | Response |
|---|---|---|---|
| `POST` | `/operation/loan` | `{ copyId, fromUserId, toUserId, communityId }` | `{ operationId }` |
| `POST` | `/operation/return` | `{ copyId, fromUserId, communityId }` | `{ operationId }` |
| `POST` | `/operation/ownership-transfer` | `{ copyId, fromUserId, toUserId, communityId }` | `{ operationId }` |
| `POST` | `/operation/decommission` | `{ copyId, userId }` | `{ operationId }` |

### Supporting queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/operation` | Full operation history. |
| `GET` | `/operation/:id` | One operation (404 if it does not exist). |
| `GET` | `/operation/open?userId=X[&communityId=Y]` | `{ hasOpenOperations: boolean }` (see 2.5). |

### In-memory dependency data (for loading test data)

| Method | Route | Body / response |
|---|---|---|
| `POST` | `/copy` | `{ ownerUserId }` → `{ copyId }`. The copy starts active and held by its owner. |
| `GET` | `/copy`, `/copy/:id` | Copy state: `{ copyId, ownerUserId, holderUserId, active }`. |
| `PUT` | `/community/:communityId/members/:userId` | `{ active: boolean }`. Creates or updates the membership. |
| `GET` | `/community/:communityId/members` | The community's memberships. |

### How each specification rule is met

| Rule | Implementation |
|---|---|
| 1. Only existing copies | `CopyService.findOne` throws `NotFoundException` (404). |
| 2. A decommissioned copy takes part in nothing | `findActiveCopy` throws 409 in all 4 operations, including a second decommission. |
| 3 and 4. Only the holder lends; being the owner is not enough | In the loan, `holderUserId` is compared with `fromUserId`, never `ownerUserId` (403). |
| 5. The return goes back to the current owner | `setHolder(copyId, ownerUserId)`. The owner is read at the time of the return, so it respects transfers made while on loan. |
| 6. Only the current owner transfers | In the transfer, `ownerUserId` is compared with `fromUserId` (403). |
| 7. Transferring does not require holding the copy | The transfer does not look at `holderUserId` and does not change it. |
| 8. The transfer can be done at any time to another user | The copy is not required to be held by the owner; only that `toUserId` is another user. |
| 9. Only between people in the same active community | `canOperateTogether` in loan, return (returner and owner) and transfer (403). |

All validations are done **before** modifying state, so a failing operation does not leave half-applied changes or record anything in the history. There is a test that verifies this.

---

## 5. Environment problems found and how they were solved

Before writing code, `npm test`, `npm run test:e2e`, `npm run lint` and `npm run build` were run on the original scaffold. **They all failed**, for reasons unrelated to this task:

### 5.1 `node_modules` offloaded by iCloud

The repo folder is in `~/Documents`, which iCloud Drive syncs. iCloud had freed the space of the `node_modules` files: they were left as `dataless` files, and reading them gave `Operation timed out` (for example, the `oxlint` binary) or `MODULE_NOT_FOUND` (Jest).

- **Solution:** `npm ci`, which reinstalls `node_modules` from `package-lock.json`. After that, `lint` and `build` passed.
- **Recommendation:** it can happen again. It is best to move the repo out of `~/Documents` or exclude `node_modules` from iCloud (for example, by renaming it to `node_modules.nosync` with a symlink).

### 5.2 TypeScript 6 `TS5011` error in the tests

`ts-jest` failed with *"The 'rootDir' setting must be explicitly set"*, because TypeScript 6 requires an explicit `rootDir`.

- **Solution:** `"rootDir": "./"` in `tsconfig.json`. It is the same line that `user-management/tsconfig.json` already has.

### 5.3 NestJS 12 is ESM-only and Jest could not load it

Jest failed with *"Must use import to load ES Module: @nestjs/testing"*. Jest 30 only loads ESM from CommonJS if Node exposes `vm.SourceTextModule`, and that requires the `--experimental-vm-modules` flag.

- **Solution:** the test scripts run `node --experimental-vm-modules node_modules/jest/bin/jest.js`. They are the same scripts `user-management/package.json` already has.
- A Node `ExperimentalWarning` appears when running the tests. It is expected and does not affect the result.

### 5.4 The e2e tests did not finish (hung process)

The tests passed but the Jest process never finished. It also happened with the original `test/app.e2e-spec.ts`, without any change.

- **Cause:** `AppModule` loads `ObserveModule` (`@nestjs/observe`) with placeholder credentials (`YOUR_APP_KEY`). Inside Jest, the telemetry agent's worker exits with an error and restarts itself in an infinite loop (`Worker stopped with exit code 1. Restarting worker...`), which keeps the process alive. The library has no option to disable the agent.
- **Solution:**
  - `test/operation.e2e-spec.ts` starts only `OperationModule`. It tests all the real routes over HTTP, but without the telemetry agent, and exits cleanly.
  - `"forceExit": true` was added to `test/jest-e2e.json`, so that the original `app.e2e-spec.ts`, which does use `AppModule`, does not leave `npm run test:e2e` hanging.
- That `OperationModule` is correctly registered in `AppModule` was verified by starting the real server (see 6.4). In that case the Observe worker did not restart even once.
- The `ObserveModule` configuration was not touched: it is part of the scaffold and shared by all three services.

---

## 6. Tests run and results

### 6.1 Unit tests: `npm test` → **54/54 pass (4 suites)**

They use the real in-memory implementations of `CopyService` and `CommunityService`, without mocks, so they test the integration between the three services.

**`src/operation/operation.service.spec.ts` (44 tests).** Starting data: owner 1, users 2 and 3 active in community 10, user 4 outside the community, and a copy owned by user 1.

- **Loan (16):**
  - records `LOAN` and moves the copy to the receiver without changing the owner;
  - the current holder can lend it again;
  - fails if the copy does not exist or is decommissioned;
  - fails if someone who does not hold it lends it, or the owner without holding it;
  - fails with the same user on both sides, with a receiver outside the community, with an inactive receiver, or without an active community in common;
  - a failure does not modify anything;
  - 5 invalid body variants: empty, string ID, decimal ID, negative ID, unknown field.
- **Return (8):**
  - records `RETURN` and returns the copy to the owner;
  - returns it to the **new** owner if there was a transfer while on loan;
  - in a chain 1 → 2 → 3, returns it directly to the owner;
  - fails if someone who does not hold it returns it, if it is already with its owner, if it is decommissioned, if the returner and the owner do not share an active community (and the copy does not move), or if the copy does not exist.
- **Transfer (8):**
  - records `OWNERSHIP_TRANSFER` and changes only the owner;
  - does not require holding the copy;
  - the new owner can transfer it again;
  - fails if not the owner (including the previous owner), with the same user, without a community in common, or with the copy decommissioned.
- **Decommission (5):**
  - records `DECOMMISSION` without `toUserId` and deactivates the copy;
  - the owner can decommission it even while on loan;
  - fails if not the owner, if it was already decommissioned, or if the copy does not exist.
- **Lookup (1):** `findOne` of a nonexistent operation gives 404.
- **`hasOpenOperations` (6):**
  - `false` with no loans;
  - `true` for the owner and the holder, and `false` for a third party;
  - filters by the loan's community;
  - `false` after the return, the decommission, or transferring ownership to the holder.

**`src/copy/copy.service.spec.ts` (5 tests):**

- the copy is created active and held by the owner;
- rejects an invalid owner;
- updates holder, owner and state;
- does not expose the internal entity (mutating the result does not alter the state);
- 404 for a nonexistent copy.

**`src/community/community.service.spec.ts` (4 tests):**

- two active members can operate;
- members of different communities cannot;
- an inactive member cannot;
- validates that `active` is a boolean.

**`src/app.controller.spec.ts` (1 test):** the original scaffold test, unchanged.

### 6.2 End-to-end tests: `npm run test:e2e` → **10/10 pass (2 suites)**

**`test/operation.e2e-spec.ts` (9 tests).** Starts the Nest application and makes real HTTP requests with `supertest`:

1. **Full flow:**
   - loan 1 → 2 (201);
   - `hasOpenOperations` of 2 in community 10 is `true`;
   - transfer 1 → 3 while on loan (the holder is still 2);
   - return by 2 (the copy goes to 3, the new owner);
   - `hasOpenOperations` of 2 becomes `false`;
   - decommission by 3 (`active: false`);
   - the history has `LOAN`, `OWNERSHIP_TRANSFER`, `RETURN` and `DECOMMISSION` in that order;
   - `GET /operation/:id` returns all fields, including a valid date.
2. A nonexistent copy gives 404.
3. On a decommissioned copy, all 4 operations give 409.
4. The owner tries to lend a copy they do not hold: 403.
5. A user who is not the owner tries to transfer: 403.
6. Someone who does not hold the copy returns it: 403.
7. Users who are not active in the same community: 403. Tested with a user outside the community and with one deactivated via `PUT`.
8. Invalid bodies: 400 (empty, same user, string ID, unknown field).
9. Invalid query and route parameters: 400 (missing `userId`, `userId=abc`, `/operation/abc`). A nonexistent operation gives 404.

**`test/app.e2e-spec.ts` (1 test):** the original (`GET /` → "Hello World!"), unchanged.

### 6.3 Verifying the tests with mutations

To confirm that the tests really catch bugs, each rule was deliberately broken, one at a time. The `src/operation` tests were run and then the original code was restored. `cmp` was used to verify that the code was left identical.

| Mutation introduced | Result |
|---|---|
| M1: the loan does not check that `fromUserId` is the holder | Caught (2 tests fail) |
| M2: the transfer does not check that `fromUserId` is the owner | Caught (2 fail) |
| M3: it is not checked whether the copy is decommissioned | Caught (4 fail) |
| M4: `canOperateTogether` always returns `true` | Caught (6 fail) |
| M5: the return leaves the copy with the returner | Caught (4 fail) |
| M6: the loan allows `fromUserId == toUserId` | Caught (2 fail) |
| M7: any user can decommission | Caught (1 fails) |
| M8: the transfer also changes the holder | Caught (3 fail) |

**All 8 mutations were caught.**

### 6.4 Manual test against the real server

The project was compiled (`npm run build`) and `node dist/main` was started with `PORT=3099`, using the full `AppModule`, with `ObserveModule` included. Then it was tested with `curl`:

| Step | Result |
|---|---|
| 3 active memberships in community 10 and a copy owned by user 1 | 200 / 201 |
| Loan 1 → 2 | 201 `{ operationId }` |
| Owner 1 tries to lend without holding the copy | 403 `User 1 does not currently have copy …` |
| `GET /operation/open?userId=2&communityId=10` | 200 `{ hasOpenOperations: true }` |
| Transfer 1 → 3 | 201 |
| Return by 2 | 201. The copy ends up with `ownerUserId: 3`, `holderUserId: 3`. |
| Loan 3 → 4 (4 is not a member) | 403 `Users 3 and 4 are not both active members of community 10` |
| Decommission by 3 | 201 |
| Loan after the decommission | 409 `Copy … has been decommissioned` |
| Nonexistent copy | 404 `Copy 5 not found` |
| Invalid body | 400 `copyId must be a positive integer` |
| `GET /operation` | `LOAN 1→2`, `OWNERSHIP_TRANSFER 1→3`, `RETURN 2→3`, `DECOMMISSION 3` (no `toUserId` or community) |

The logs confirmed that all 13 routes were registered.

### 6.5 Build, lint and formatting

- `npm run build`: no errors.
- `npm run lint` (oxlint): no errors or warnings.
- `prettier --check`: all new files follow the project's formatting. `prettier --write` was run on three files that had formatting differences.

---

## 7. Pending items and limitations

- **Real integration with services I and III:** `CopyService` and `CommunityService` must be replaced with HTTP clients when those services expose holder, active state and active memberships. The `OperationService` logic should not change.
- **`user-management` does not yet call `hasOpenOperations`:** its `UserService.remove` has a `TODO` for that. It was not modified because it is outside this project.
- **Users are not validated to exist:** this service has no user registry. Existence is covered indirectly: to operate between two people, both must be active members of the community. For the decommission, being the owner is the only requirement.
- **Data is lost when the server restarts**, like in the rest of the project.
- See also the `hasOpenOperations` limitation with loan chains (2.5) and the iCloud problem (5.1).
