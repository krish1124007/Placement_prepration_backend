import {
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
} from "../controllers/student/student.controller.js";
import { Router } from "express";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.post("/create", createStudent);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/google-signup", googleSignup);
router.post("/connect-github", connectGithub);
router.post("/disconnect-github/:userid", disconnectGithub);
router.get("/github-repos/:userid", auth, getGithubRepos);
router.put("/edit-user/:userid", auth, editUser);
router.get("/user/:userid", auth, getUser);
router.get("/public/:userid", getUserPublic); // Public endpoint for portfolio
router.put("/toggle-ultra-focus/:userid", auth, toggleUltraFocusMode);

export const user_router = router;
