import { User } from "../model/userModel.js";
import bcypt from "bcrypt";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../model/postModel.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("data in req body is", req.body);
    // validation
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    const user = await User.findOne({
      email,
    });

    if (user) {
      return res
        .status(400)
        .json({ message: "Email id already exists", success: false });
    }

    // password hashing
    const hashedPassword = await bcypt.hash(password, 12);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res
      .status(201)
      .json({ message: "User registered successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    let user = await User.findOne({
      email,
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid Email Id", success: false });
    }

    const isPasswordCorrect = await bcypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "Invalid Password", success: false });
    }

    // populate each post if in the post array
    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);

        if (post.author.equals(user._id)) {
          return post;
        }
        return null;
      })
    );
    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      followings: user.followings,
      posts: populatedPosts,
    };

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({ message: `Welcome ${user.username}`, success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .cookie("token", "", { maxAge: 0 })
      .json({ message: "Logged out successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId);
    console.log("user details in getmyprofile is", user);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Email ID not found", success: false });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;

    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);

      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (bio) {
      user.bio = bio;
    }
    if (gender) {
      user.gender = gender;
    }
    if (profilePicture) {
      user.profilePicture = cloudResponse.secure_url;
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully", success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggesetedUsers = await User.find({
      _id: { $ne: req.id },
    }).select("-password");

    if (!suggesetedUsers) {
      return res
        .status(404)
        .json({ message: "Currently do not have any users", success: false });
    }

    return res.status(200).json({ success: true, users: suggesetedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followOrUnfollow = req.id;
    const isFollowingOrNot = req.params.id;

    if (followOrUnfollow === isFollowingOrNot) {
      return res.status(400).json({
        message: "You cannot follow/unfollow yourself",
        success: false,
      });
    }

    let user = await User.findById(followOrUnfollow);

    const targetUser = await User.findById(isFollowingOrNot);

    if (!user || !targetUser) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const isFollowing = user.followings.includes(isFollowingOrNot);

    // unfollow logic
    if (isFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: followOrUnfollow },
          { $pull: { followings: isFollowingOrNot } }
        ),
        User.updateOne(
          { _id: isFollowingOrNot },
          { $pull: { followers: followOrUnfollow } }
        ),
      ]);

      return res
        .status(200)
        .json({ message: "Unfollowed successfully", success: true });
    } else {
      // Follow logic
      await Promise.all([
        User.updateOne(
          { _id: followOrUnfollow },
          { $push: { followings: isFollowingOrNot } }
        ),
        User.updateOne(
          { _id: isFollowingOrNot },
          { $push: { followers: followOrUnfollow } }
        ),
      ]);

      return res
        .status(200)
        .json({ message: "Followed successfully", success: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};
