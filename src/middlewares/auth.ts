import jwt from "jsonwebtoken"
import type {Request,Response,NextFunction} from "express"



export const auth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    console.log(token)
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        next();
    });
}
