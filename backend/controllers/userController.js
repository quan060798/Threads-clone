import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";
import Post from "../models/postModel.js";

const getUserProfile = async (req, res) => {
    const { query } = req.params;

    try {
        let user;
        if (mongoose.Types.ObjectId.isValid(query)) {
            user = await User.findById(query).select('-password').select('-updatedAt');
        } else {
            user = await User.findOne({username: query}).select('-password').select('-updatedAt');
        }
        if (!user) {
            return res.status(400).json({
                error: "User not found"
            });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


const signupUser = async (req, res) => {
    try {
        const {name, email, username, password} = req.body;
        const user = await User.findOne({$or:[{email}, {username}]});

        if (user) {
            return res.status(400).json({
                error: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            username,
            password: hashedPassword
        })

        await newUser.save();

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                bio: newUser.bio,
                profilePicture: newUser.profilePic
            })
        } else {
            res.status(400).json({
                error: "Invalid User Data"
            });
        }

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const {username, password} = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({
                error: "Invalid Credentials"
            })
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                error: "Invalid Credentials"
            })
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
        })


    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const logOutUser = async (req, res) => {
    try {
        res.cookie('jwt', '', {maxAge: 1});
        res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const followUnfollowUser = async (req, res) => {
    try {
        
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);
        
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                error: "You cannot follow/unfollow yourself"
            })
        }

        if (!userToModify || !currentUser) {
            return res.status(400).json({
                error: "User not found"
            })
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow user
            // Modify Current User following, modify followers of userToModify
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id }});
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id }});
            res.status(200).json({
                message: "User unfollowed successfully"
            })
        } else {
            // Follow User
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id }});
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id }});
            res.status(200).json({
                message: "Followed User"
            })
        }
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const updateUser = async (req, res) => {
    const {name, email, username, password, bio } = req.body;
    let { profilePic } = req.body;
    const userId = req.user._id;
    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                error: "User not found"
            })
        }

        if (req.params.id !== userId.toString()) {
            return res.status(400).json({
                error: "Invalid Credential"
            });
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        if (profilePic) {
            if (user.profilePic) {
                await cloudinary.uploader.destroy(user.profilePic.split('/').pop().split('.')[0]);
            }
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            profilePic = uploadResponse.secure_url;
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.username = username || user.username;
        user.profilePic = profilePic || user.profilePic;
        user.bio = bio || user.bio;

        user = await user.save();

        await Post.updateMany(
            {"replies.userId":userId},
            {
                $set: {
                    "replies.$[reply].userProfilePic": user.profilePic,
                    "replies.$[reply].username": user.username
                }
            },
            {arrayFilters:[{"reply.userId":userId}]}
        )

        user.password = null;

        res.status(200).json({
            message: "Profile updated successfully",
            user: user
        });

        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const getSuggestedUsers = async (req, res) => {
	try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export { signupUser, loginUser, logOutUser, followUnfollowUser, updateUser, getUserProfile, getSuggestedUsers }