# Service I - Copy Management

## Context

This service manages information about works, their editions, and physical copies inside the Libros Circulares system.

The object on which loans and other operations are performed is a copy.

A work can have multiple editions, and each edition can have multiple copies.

---

## Technical context

- The project uses NestJS.
- For the current implementation, information is stored in memory.
- Do not generate tests.
- This service only manages information about works, editions, authors, and copies.
- Loan, return, ownership transfer, and decommission operations belong to Service II.

---

## Main rules

1. A work must have:
   - title
   - genre
   - one or more authors

2. An author must have:
   - first name
   - last name
   - nationality
   - country of residence

3. A work can have multiple editions.

4. Each edition belongs to one work.

5. An edition must store:
   - publisher
   - year

6. A copy belongs to one edition.

7. Each copy must store:
   - current owner
   - current holder

8. The owner and the person currently holding the copy can be different.

---

## Entities

### Author

```typescript
export class Author {
  authorId: number;
  name: string;
  lastName: string;
  nationality: string;
  countryOfResidence: string;
}
```

### Work

```typescript
export class Work {
  workId: number;
  title: string;
  genre: string;
  authors: Author[] = [];
}
```

### Edition

```typescript
export class Edition {
  editionId: number;
  workId: number;
  publisher: string;
  year: number;
}
```

### Copy

```typescript
export class Copy {
  copyId: number;
  editionId: number;
  ownerUserId: number;
  holderUserId: number;
}
```

---

## Operations

### Create author

**HTTP method:** `POST`

**Input:**

- name
- lastName
- nationality
- countryOfResidence

**Success:**

Return the generated `authorId`.

---

### Create work

**HTTP method:** `POST`

**Input:**

- title
- genre
- authorIds

**Validations:**

- At least one author must be provided.
- All provided authors must exist.

**Success:**

Return the generated `workId`.

---

### Create edition

**HTTP method:** `POST`

**Input:**

- workId
- publisher
- year

**Validations:**

- The work must exist.

**Success:**

Return the generated `editionId`.

---

### Create copy

**HTTP method:** `POST`

**Input:**

- editionId
- ownerUserId

**Validations:**

- The edition must exist.
- The owner user must exist.

**Behavior:**

When a copy is created, the owner is also initially the person holding it.

```typescript
ownerUserId = userId;
holderUserId = userId;
```

**Success:**

Return the generated `copyId`.

---

### Get work

**HTTP method:** `GET`

**Input:**

- workId

**Success:**

Return the work information.

---

### Get edition

**HTTP method:** `GET`

**Input:**

- editionId

**Success:**

Return the edition information.

---

### Get copy

**HTTP method:** `GET`

**Input:**

- copyId

**Success:**

Return:

- copyId
- editionId
- ownerUserId
- holderUserId

---

## Methods used by Service II

Service II needs to read and modify copy information.

Service I must provide at least:

```typescript
getCopy(copyId: number): Copy;
```

```typescript
changeOwner(
  copyId: number,
  newOwnerUserId: number
): void;
```

```typescript
changeHolder(
  copyId: number,
  newHolderUserId: number
): void;
```

These operations are used by Service II for loans, returns, and ownership transfers.

---

## Main relationships

```text
Author
   N
   |
   N
Work
   1
   |
   N
Edition
   1
   |
   N
Copy
```

A work can have multiple authors.

A work can have multiple editions.

An edition can have multiple copies.

---

## Common error cases

- Creating a work with an author that does not exist.
- Creating an edition for a work that does not exist.
- Creating a copy for an edition that does not exist.
- Creating a copy with an owner that does not exist.
- Getting a work that does not exist.
- Getting an edition that does not exist.
- Getting a copy that does not exist.
