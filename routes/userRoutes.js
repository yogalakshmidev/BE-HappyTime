import express from "express";
import {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  login,
  logout,
  register,
} from "../controller/userController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/logout", logout);
userRouter.get("/MyProfile/:id", isAuthenticated, getProfile);
userRouter.post(
  "/MyProfile/edit",
  isAuthenticated,
  upload.single("profilePicture"),
  editProfile
);
userRouter.get("/suggested", isAuthenticated, getSuggestedUsers);
userRouter.post("/followorunfollow/:id", isAuthenticated, followOrUnfollow);

export default userRouter;
