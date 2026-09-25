"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = exports.OperationType = void 0;
var OperationType;
(function (OperationType) {
    OperationType["LOAN"] = "LOAN";
    OperationType["RETURN"] = "RETURN";
    OperationType["OWNERSHIP_TRANSFER"] = "OWNERSHIP_TRANSFER";
    OperationType["DECOMMISSION"] = "DECOMMISSION";
})(OperationType || (exports.OperationType = OperationType = {}));
class Operation {
    operationId;
    type;
    copyId;
    fromUserId;
    toUserId;
    communityId;
    date;
}
exports.Operation = Operation;
//# sourceMappingURL=operation.entity.js.map