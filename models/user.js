import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUID: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
