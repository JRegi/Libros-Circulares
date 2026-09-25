# User management system specification

# Global context

This is a NestJS project. It features a layered structure of it's functionalities in order to implement them. Instruction for AI: If you find any conflict within your reasoning/plan process, ask before proceding. Do not introduce entities, endpoints, dependencies, or architectural changes that are not required by this specification. If an implementation decision cannot be inferred from this specification, ask before implementing it. Do not modify files outside the user-management module unless explicitly
requested.

# Local service context

The user-management module offers a service to manage users within the 'Libros-Circulares' project. It's scope covers:

- Register / unregisterig of users.
- Change of user information.
- Creation / deletion of communities.
- Managements of users's contact information.
- Management of users within a community.

Operation specific processes are outside of the scope of this file and are covered in the specitication found inside the operation-management project.

DNI stands for "Documento Nacional de Identidad".

# Technical restrictions

We are working directly in memory, not in a DB. Do not generate tests.

`userId` and `communityId` are auto-generated.

The operation-management service must provide a way to check whether a user has open operations. Something like `hasOpenOperations()`

# Service specification

A user's contact can be a reference to another user's contact, and that is obligatory when the user is a minor.
Every user must have access to at least one contact method: email or phone.
The management of the communitys is made by devs (me & you).
A user can be a member of at maximum 3 communities simultaneously.

Operations can be donde only within members of the same community.
During registration, the user's DNI, name and last name must be validated through a RENAPER service.
For the current in-memory implementation, RENAPER may be represented through a mocked external service.

## Entities to make

## Class _Community_

```typescript
export class Community {
  communityId: number;
  name: string;
  members: CommunityMembership[] = [];
}
```

## Class _CommunityMembership_

```typescript
export class CommunityMembership {
  userId: number;
  communityId: number;
  active: boolean;
}
```

## Class _User_

```typescript
export class User {
  userId: number;

  name: string;

  lastName: string;

  email?: string;

  phone?: string;

  birthDate: Date;

  dni: string;

  contactUserId?: number;

  communities: CommunityMembership[] = [];
}
```

DNI is unique for each user.
If `contactUserId` is defined, it must reference an existing user whose contact information contains at least one email or phone.

## Permmited operations / flows

## Register a user

- HTTP Request: POST.
- Input: name, lastName, optional email, optional phone, birthDate, dni, optional contactUserId.
- Validation requirements:
  - DNI must not already be in use.
  - DNI, name and lastName must be successfully validated through RENAPER.
  - The user must have at least one valid contact method, either directly or through `contactUserId`.
  - If `contactUserId` is provided, the referenced user must exist.
  - A userId must be successfully generated.
- Output:
  - Successful operation: userId.
  - Failed operation: Corresponding HTTP status code & message.

## Unregister a user

- HTTP Request: DELETE.
- Input: userId.
- Validation requirements:
  - The user must exist.
  - All operations involving the user must be successfully closed.
- Behavior:
  - The user and their community memberships are removed from memory.
- Output:
  - Successful operation: Corresponding HTTP status code & message.
  - Failed operation: Corresponding HTTP status code & message.

## Change user parameters (except for ID)

- HTTP Request: PATCH.
- Input: Parameters to change according to the entity's data transfer object.
- Validation requirements:
  - userId cannot be changed.
  - If DNI is changed, the new DNI must be unique.
  - If DNI, name or lastName are changed, DNI, name and lastName must be validated again through RENAPER.
  - After any contact-related change, the user must still have at least one valid contact method, either directly or through `contactUserId`.
  - If `contactUserId` is changed, the referenced user must exist and have at least one contact method.
- Output:
  - Successful & failed operation: Corresponding HTTP status code & message.

## Create a community

- HTTP Request: POST.
- Input: Community name.
- Validation requirement:
  - A communityId must be successfully generated.
- Output:
  - Successful operation: communityId.
  - Failed operation: Corresponding HTTP status code & message.

## Delete a community

- HTTP Request: DELETE.
- Input: communityId.
- Validation requirements:
  - The community must exist.
  - The community must not have active members.
  - There must be no open operations associated with the community.
- Output:
  - Successful operation: Corresponding HTTP status code & message.
  - Failed operation: Corresponding HTTP status code & message.

## Associate a user with a community

- HTTP Request: POST.
- Input: userId, communityId.
- Validation requirements:
  - The user must exist.
  - The community must exist.
  - The user must not already be associated with the community.
- Behavior:
  - A new `CommunityMembership` is created.
  - The membership is inactive by default.
- Output:
  - Successful operation: Corresponding HTTP status code & message.
  - Failed operation: Corresponding HTTP status code & message.

## Activate a user in a community

- HTTP Request: PATCH.
- Input: userId, communityId.
- Validation requirements:
  - The user must exist.
  - The community must exist.
  - A membership between the user and community must exist.
  - The membership must currently be inactive.
  - The user must currently be active in fewer than 3 communities.
- Behavior:
  - The membership becomes active.
- Output:
  - Successful operation: Corresponding HTTP status code & message.
  - Failed operation: Corresponding HTTP status code & message.

## Inactivate a user in a community

- HTTP Request: PATCH.
- Input: userId, communityId.
- Validation requirements:
  - The user must exist.
  - The community must exist.
  - A membership between the user and community must exist.
  - The membership must currently be active.
  - The user must have no open operations in that community.
- Behavior:
  - The membership becomes inactive.
- Output:
  - Successful operation: Corresponding HTTP status code & message.
  - Failed operation: Corresponding HTTP status code & message.

# Conflictive use cases

- Registering or changing a DNI to one already in use.
  - Fail operation.

- RENAPER validation fails.
  - Fail operation.

- RENAPER service is unavailable.
  - Fail operation.

- Registering or updating a user without a valid email, phone or valid contact reference.
  - Fail operation.

- Referencing a non-existing user through `contactUserId`.
  - Fail operation.

- Associating a user with a community that does not exist.
  - Fail operation.

- Associating a non-existing user with a community.
  - Fail operation.

- Associating a user with a community they are already associated with.
  - Fail operation.

- Activating a user who is already active in 3 communities.
  - Fail operation.

- Inactivating a user from a community while they have open operations in that community.
  - Fail operation.

- Performing an operation between users who are not active members of the same community.
  - Fail operation.

- Unregistering a user while they have open operations.
  - Fail operation.

- Deleting a community while it has active users or open operations.
  - Fail operation.
