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

  // Not set for DECOMMISSION. For RETURN it is the owner receiving the copy.
  toUserId?: number;

  // Community the operation was made in. Not set for DECOMMISSION.
  communityId?: number;

  date: Date;
}
