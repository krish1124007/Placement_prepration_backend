import type { Request, Response, NextFunction } from "express";


type Handler = (req: Request, res: Response, next: NextFunction) => Promise<Response>

function asyncHandler(fn: Handler) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

export { asyncHandler }