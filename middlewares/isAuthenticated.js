import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "User not authenticated", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json({ message: "User not authenticated", success: false });
    }

    req.id = decoded.userId;

    next();
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

export default isAuthenticated;
