export declare enum OperationType {
    LOAN = "LOAN",
    RETURN = "RETURN",
    OWNERSHIP_TRANSFER = "OWNERSHIP_TRANSFER",
    DECOMMISSION = "DECOMMISSION"
}
export declare class Operation {
    operationId: number;
    type: OperationType;
    copyId: number;
    fromUserId: number;
    toUserId?: number;
    communityId?: number;
    date: Date;
}
