import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Comment } from "../model/commentModel.js";
import { Post } from "../model/postModel.js";
import { User } from "../model/userModel.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;
    if (!image) {
      return res
        .status(400)
        .json({ message: "Image is required", success: false });
    }
    // image upload
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // Buffer to dataUri
    const fileUri = `data:image/jpeg;base64,+ ${optimizedImageBuffer.toString("base64")}`;

    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    const user = await User.findById(authorId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    user.posts.push(post._id);
    await user.save();

    await post.populate({ path: "author", select: "-password" });

    return res
      .status(201)
      .json({ message: "New Post Added", success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getAllPost = async (req, res) => {
  try {
    const post = await Post.find()
      .sort({ createdAt: "desc" })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture" },
      });

    return res
      .status(200)
      .json({ message: "Get all post done", success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const post = await Post.find({ author: authorId })
      .sort({ createdAt: "desc" })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture" },
      });

    return res
      .status(200)
      .json({ message: "Get user post done", success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message, success });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const likeOrdislikeuserId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // like logic
    await post.updateOne({ $addToSet: { likes: likeOrdislikeuserId } });

    await post.save();

    //  implement socket.io here for real time notification

    return res.status(200).json({ message: "Like done", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const likeOrdislikeuserId = req.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // dislike logic
    await post.updateOne({ $pull: { likes: likeOrdislikeuserId } });

    await post.save();

    //  implement socket.io here for real time notification

    return res.status(200).json({ message: "disLike done", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentUserId = req.id;
    const { text } = req.body;
    const post = await Post.findById(postId);

    if (!text) {
      return res
        .status(400)
        .json({ message: "Text is required", success: false });
    }

    const comment = await Comment.create({
      text,
      author: commentUserId,
      post: postId,
    }).populate({
      path: "author",
      select: "username profilePicture",
    });

    post.comments.push(comment._id);
    await post.save();

    return res
      .status(201)
      .json({ message: "Comment added", success: true, comment });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePicture"
    );

    if (!comments) {
      return res
        .status(404)
        .json({ message: "No comments found for this post", success: false });

      return res
        .status(200)
        .json({ message: "Get comments done", success: true, comments });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // check if the post is created by the user
    if (post.author.toString() !== authorId) {
      return res.status(401).json({
        message: "You are not authorized to delete this post",
        success: false,
      });
    }

    // delete post
    await Post.findByIdAndDelete(postId);

    // delete post from user model
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    //  delete associated comments

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({ message: "Post deleted", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const user = await User.findById(authorId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (user.bookmarks.includes(post._id)) {
      // already bookmarked -> remove from bookmark

      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: "unsaved",
        message: "Post removed from bookmark",
        success: true,
      });
    } else {
      // bookmark the post
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: "saved",
        message: "Post saved to bookmark",
        success: true,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};
