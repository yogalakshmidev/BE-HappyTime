import express from "express";

import {
  addComment,
  addNewPost,
  bookmarkPost,
  deletePost,
  dislikePost,
  getAllPost,
  getCommentsOfPost,
  getUserPost,
  likePost,
} from "../controller/postController.js";

import upload from "../middlewares/multer.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const postRouter = express.Router();

postRouter.post("/addPost", isAuthenticated, upload.single("image"), addNewPost);
postRouter.post("/allPosts", isAuthenticated,upload.single("image"), getAllPost);
postRouter.post("/userpost/all",isAuthenticated,upload.single("image"),getUserPost);
postRouter.post("/like/:id", isAuthenticated, upload.single("image"), likePost);
postRouter.post("/dislike/:id",isAuthenticated,upload.single("image"),dislikePost);
postRouter.post("/comment/:id",isAuthenticated,upload.single("image"),addComment);
postRouter.post("/comment/all/:id", isAuthenticated,upload.single("image"),getCommentsOfPost);
postRouter.post("/delete/:id",isAuthenticated,upload.single("image"),deletePost);
postRouter.post("/bookmark/:id", isAuthenticated, upload.single("image"), bookmarkPost);

export default postRouter;
