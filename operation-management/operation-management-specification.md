# Service II - Operation Management

## Context

This service manages the operations that can be performed on book copies inside the Libros Circulares system.

The allowed operations are:

- Loan.
- Return.
- Ownership transfer.
- Copy decommission.

The copy is the object on which all operations are performed.

---

## Technical context

- The project uses NestJS.
- For the current implementation, information is stored in memory.
- Do not generate tests.
- This service may read copy and user information from the other services.

---

## Main rules

1. Operations can only be performed on existing copies.

2. A decommissioned copy cannot participate in any operation.

3. A loan can only be performed by the person who currently has the copy.

4. Being the owner of the copy is not enough to lend it if the owner does not currently have it.

5. A return makes the copy go back to its current owner.

6. An ownership transfer can only be performed by the current owner.

7. The owner does not need to currently hold the copy in order to transfer ownership.

8. Ownership can be transferred at any time to another user.

9. Operations can only be performed between users who are active in the same community.

---

## Operation entity

```typescript
export enum OperationType {
  LOAN = 'LOAN',
  RETURN = 'RETURN',
  OWNERSHIP_TRANSFER = 'OWNERSHIP_TRANSFER',
  DECOMMISSION = 'DECOMMISSION',
}

export class Operation {
  operationId: number;
  type: OperationType;
  copyId: number;
  fromUserId: number;
  toUserId?: number;
  date: Date;
}
```

`toUserId` is optional because some operations, such as decommissioning a copy, do not require another user.

---

## Operations

### Perform loan

**HTTP method:** `POST`

**Input:**

- copyId
- fromUserId
- toUserId
- communityId

**Validations:**

- The copy must exist.
- The copy must not be decommissioned.
- `fromUserId` must be the person currently holding the copy.
- `fromUserId` and `toUserId` must be active in the same community.
- `fromUserId` and `toUserId` must be different users.

**Behavior:**

- Register an operation of type `LOAN`.
- The current holder of the copy becomes `toUserId`.
- The owner of the copy does not change.

**Success:**

Return the `operationId`.

---

### Perform return

**HTTP method:** `POST`

**Input:**

- copyId
- fromUserId
- communityId

**Validations:**

- The copy must exist.
- The copy must not be decommissioned.
- `fromUserId` must be the person currently holding the copy.
- The copy must have a current owner.
- The returning user and the owner must be able to operate inside the same community.

**Behavior:**

- Register an operation of type `RETURN`.
- The current holder of the copy becomes the current owner.

**Success:**

Return the `operationId`.

---

### Transfer ownership

**HTTP method:** `POST`

**Input:**

- copyId
- fromUserId
- toUserId
- communityId

**Validations:**

- The copy must exist.
- The copy must not be decommissioned.
- `fromUserId` must be the current owner of the copy.
- `fromUserId` does not need to currently hold the copy.
- `fromUserId` and `toUserId` must be active in the same community.

**Behavior:**

- Register an operation of type `OWNERSHIP_TRANSFER`.
- The current owner becomes `toUserId`.
- The person currently holding the copy does not change.

**Success:**

Return the `operationId`.

---

### Decommission a copy

**HTTP method:** `POST`

**Input:**

- copyId
- userId

**Validations:**

- The copy must exist.
- The copy must not already be decommissioned.

**Behavior:**

- Register an operation of type `DECOMMISSION`.
- Mark the copy as unavailable.
- From that moment, no new loans, returns, or ownership transfers can be performed on it.

**Note:**

The assignment does not explicitly define which user is allowed to decommission a copy. If this rule is needed, it must be decided before implementing it.

---

## Dependency on Service I

Service II needs to read and update copy information.

At minimum, it needs:

```typescript
{
  copyId: number;
  ownerUserId: number;
  holderUserId: number;
  active: boolean;
}
```

Service II must be able to:

- Get the current owner.
- Get the current holder.
- Change the current holder.
- Change the current owner.
- Mark a copy as decommissioned.

---

## Dependency on Service III

Before performing an operation between two users, the service must verify that both users are allowed to operate inside the same community.

A conceptual validation can be used:

```typescript
canOperateTogether(
  userId1: number,
  userId2: number,
  communityId: number
): boolean;
```

---

## Common error cases

- The copy does not exist.
- The copy is already decommissioned.
- A person tries to lend a copy they do not currently hold.
- The owner tries to lend a copy they do not currently hold.
- A person tries to transfer ownership without being the current owner.
- A person tries to return a copy they do not currently hold.
- The users are not active in the same community.
- An operation is attempted on a decommissioned copy.
