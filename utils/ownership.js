// Reports are linked to their owner by email (older reports) and/or user id.
// Every query for reports goes through this filter, so a user can only ever
// read, compare, chat about or delete their own reports.
export function ownedBy(user) {
  return { $or: [{ userEmail: user.email }, { userId: String(user._id) }] };
}
