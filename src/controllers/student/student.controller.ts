import { Student } from "../../models/student.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import type { Response, Request, NextFunction } from "express";
import { sendMail } from "../../utils/sendMail.js";

const createStudent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { name, email, password, role, branch, passing_year, image, about, sem, github, linkedin, leetcode, projects, skills, achievements, interests } = req.body;

    if (!email || !password || !role) {
        throw new ApiError(400, "Email password and role are required");
    }

    const newStudent = await Student.create({ name, email, password, role, branch, passing_year, image, about, sem, github, linkedin, leetcode, projects, skills, achievements, interests })

    if (!newStudent) {
        throw new ApiError(400, "Student not created");
    }

    const token = newStudent.generateAccessToken();

    if (!token) {
        throw new ApiError(400, "Token not generated");
    }

    // Convert to plain object and remove password
    const studentObject = newStudent.toObject();
    delete studentObject.password;

    sendMail(newStudent.email, "Welcome to InterPrep", "Welcome to InterPrep. Your account has been created successfully");

    // Add a slight delay to allow the frontend airplane animation to play fully
    await new Promise(resolve => setTimeout(resolve, 2000));

    return apiResponse(res, 200, "Student created successfully", { ...studentObject, token })
})


const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const student = await Student.findOne({ email });

    if (!student) {
        throw new ApiError(400, "Student not found");
    }

    const isPasswordMatched = await student.comparePassword(password);

    if (!isPasswordMatched) {
        throw new ApiError(400, "Invalid credentials");
    }

    const token = student.generateAccessToken();

    if (!token) {
        throw new ApiError(400, "Token not generated");
    }

    // Convert to plain object and remove password
    const studentObject = student.toObject();
    delete studentObject.password;

    // Add a slight delay to allow the frontend airplane animation to play fully
    await new Promise(resolve => setTimeout(resolve, 2000));

    return apiResponse(res, 200, "Student logged in successfully", { ...studentObject, token })
})


const getUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { userid } = req.params;

    if (!userid) {
        throw new ApiError(400, "User id is required");
    }

    const student = await Student.findById(userid).select("-password");

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return apiResponse(res, 200, "Student fetched successfully", student)
})


const editUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { userid } = req.params;
    const updateData = req.body;

    if (!userid) {
        throw new ApiError(400, "User id is required");
    }

    // Remove password and email from updateData if present (security)
    delete updateData.password;
    delete updateData.email;

    const updatedStudent = await Student.findByIdAndUpdate(
        userid,
        { $set: updateData },
        { new: true }
    ).select("-password");

    if (!updatedStudent) {
        throw new ApiError(404, "Student not found");
    }

    return apiResponse(res, 200, "Student updated successfully", updatedStudent)
})


const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        throw new ApiError(400, "Access token is required");
    }

    try {
        // Import the verifyGoogleToken function
        const { verifyGoogleToken } = await import("../../utils/googleAuth.js");

        // Verify the Google token and get user info
        const googleUser = await verifyGoogleToken(accessToken);

        if (!googleUser.email_verified) {
            throw new ApiError(400, "Email not verified by Google");
        }

        // Find user by email or googleId
        let student = await Student.findOne({
            $or: [
                { email: googleUser.email },
                { googleId: googleUser.sub }
            ]
        });

        if (!student) {
            throw new ApiError(404, "User not found. Please sign up first.");
        }

        // If user exists but doesn't have googleId, update it
        if (!student.googleId) {
            student.googleId = googleUser.sub;
            await student.save();
        }

        const token = student.generateAccessToken();

        if (!token) {
            throw new ApiError(400, "Token not generated");
        }

        // Convert to plain object and remove password
        const studentObject = student.toObject();
        delete studentObject.password;

        // Add a slight delay to allow the frontend airplane animation to play fully
        await new Promise(resolve => setTimeout(resolve, 2000));

        return apiResponse(res, 200, "Login successful", { ...studentObject, token });
    } catch (error: any) {
        throw new ApiError(400, error.message || "Google login failed");
    }
});


const googleSignup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        throw new ApiError(400, "Access token is required");
    }

    try {
        // Import the verifyGoogleToken function
        const { verifyGoogleToken } = await import("../../utils/googleAuth.js");

        // Verify the Google token and get user info
        const googleUser = await verifyGoogleToken(accessToken);

        if (!googleUser.email_verified) {
            throw new ApiError(400, "Email not verified by Google");
        }

        // Check if user already exists
        let student = await Student.findOne({
            $or: [
                { email: googleUser.email },
                { googleId: googleUser.sub }
            ]
        });

        if (student) {
            throw new ApiError(400, "User already exists. Please login.");
        }

        // Create new student with Google info
        student = await Student.create({
            name: googleUser.name,
            email: googleUser.email,
            googleId: googleUser.sub,
            image: googleUser.picture,
            role: "student" // Default role
        });

        if (!student) {
            throw new ApiError(400, "Student not created");
        }

        const token = student.generateAccessToken();

        if (!token) {
            throw new ApiError(400, "Token not generated");
        }

        // Convert to plain object and remove password
        const studentObject = student.toObject();
        delete studentObject.password;

        // Add a slight delay to allow the frontend airplane animation to play fully
        await new Promise(resolve => setTimeout(resolve, 2000));

        return apiResponse(res, 200, "Signup successful", { ...studentObject, token });
    } catch (error: any) {
        throw new ApiError(400, error.message || "Google signup failed");
    }
});


// Connect GitHub account
const connectGithub = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { code, userId } = req.body;

    if (!code) {
        throw new ApiError(400, "Authorization code is required");
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    try {
        // Import GitHub auth functions
        const { exchangeGitHubCode, getGitHubUser, getGitHubRepos } = await import("../../utils/githubAuth.js");

        // Exchange code for access token
        const accessToken = await exchangeGitHubCode(code);

        // Get GitHub user info
        const githubUser = await getGitHubUser(accessToken);

        // Get user's repositories
        const repos = await getGitHubRepos(accessToken, githubUser.login);

        // Update user with GitHub info
        const updatedStudent = await Student.findByIdAndUpdate(
            userId,
            {
                githubId: githubUser.id.toString(),
                githubUsername: githubUser.login,
                githubAccessToken: accessToken,
                githubRepos: repos,
                github: `https://github.com/${githubUser.login}`,
            },
            { new: true }
        ).select("-password -githubAccessToken");

        if (!updatedStudent) {
            throw new ApiError(404, "Student not found");
        }

        return apiResponse(res, 200, "GitHub connected successfully", updatedStudent);
    } catch (error: any) {
        throw new ApiError(400, error.message || "GitHub connection failed");
    }
});


// Disconnect GitHub account
const disconnectGithub = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.params;

    const updatedStudent = await Student.findByIdAndUpdate(
        userid,
        {
            $unset: {
                githubId: "",
                githubUsername: "",
                githubAccessToken: "",
                githubRepos: ""
            }
        },
        { new: true }
    ).select("-password");

    if (!updatedStudent) {
        throw new ApiError(404, "Student not found");
    }

    return apiResponse(res, 200, "GitHub disconnected successfully", updatedStudent);
});


// Get GitHub repositories
const getGithubRepos = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.params;

    const student = await Student.findById(userid).select("githubId githubRepos githubUsername githubAccessToken");

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    if (!student.githubId || !student.githubAccessToken) {
        throw new ApiError(400, "GitHub not connected");
    }

    try {
        // Optionally refresh repos from GitHub
        const { getGitHubRepos: fetchRepos } = await import("../../utils/githubAuth.js");
        const repos = await fetchRepos(student.githubAccessToken, student.githubUsername!);

        // Update cached repos
        student.githubRepos = repos as any;
        await student.save();

        return apiResponse(res, 200, "Repositories fetched successfully", { repos });
    } catch (error: any) {
        // If fetch fails, return cached repos
        return apiResponse(res, 200, "Returning cached repositories", { repos: student.githubRepos || [] });
    }
});

// Get user data for public portfolio (no authentication required)
const getUserPublic = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.params;

    if (!userid) {
        throw new ApiError(400, "User id is required");
    }

    const student = await Student.findById(userid).select("-password -githubAccessToken");

    if (!student) {
        throw new ApiError(404, "User not found");
    }

    return apiResponse(res, 200, "User data fetched successfully", student);
});


// Toggle ultra focus mode
const toggleUltraFocusMode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.params;
    let { ultra_focus_mode } = req.body;

    if (!userid) {
        throw new ApiError(400, "User id is required");
    }

    // Convert string to boolean if needed (handles "true"/"false" strings from mobile apps)
    if (typeof ultra_focus_mode === "string") {
        ultra_focus_mode = ultra_focus_mode.toLowerCase() === "true";
    }

    if (typeof ultra_focus_mode !== "boolean") {
        throw new ApiError(400, "ultra_focus_mode must be a boolean value");
    }

    const updatedStudent = await Student.findByIdAndUpdate(
        userid,
        { ultra_focus_mode },
        { new: true }
    ).select("-password");

    if (!updatedStudent) {
        throw new ApiError(404, "Student not found");
    }

    return apiResponse(res, 200, "Ultra focus mode updated successfully", updatedStudent);
});


export {
    createStudent,
    login,
    editUser,
    getUser,
    googleLogin,
    googleSignup,
    connectGithub,
    disconnectGithub,
    getGithubRepos,
    getUserPublic,
    toggleUltraFocusMode
}
