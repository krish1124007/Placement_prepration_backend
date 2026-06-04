import { Router } from "express";
import { createLearning, listTheLearning } from "../controllers/learning/learning.controller.js";


const router = Router();


router.route("/create-learning").post(createLearning);
router.route("/list-learning").get(listTheLearning);


export default router;