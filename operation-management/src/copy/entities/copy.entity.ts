// Minimal copy information this service needs from Servicio I
// (copy-management). Kept in memory here until that service exposes it.
export class Copy {
  copyId: number;
  ownerUserId: number;
  // Who currently has the copy in their possession.
  holderUserId: number;
  // false once the copy has been decommissioned.
  active: boolean;
}
