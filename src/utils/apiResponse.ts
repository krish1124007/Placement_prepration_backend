import type { Response } from "express";

/**
 * Restrict allowed HTTP status codes
 * (extend if needed)
 */
export type HttpStatusCode =
    | 200
    | 201
    | 400
    | 401
    | 403
    | 404
    | 500;

/**
 * Generic API response shape
 */
export interface ApiResponseShape<T> {
    status: HttpStatusCode;
    message: string;
    data: T | null;
}

/**
 * API Response class
 */
export class ApiResponse<T> implements ApiResponseShape<T> {
    status: HttpStatusCode;
    message: string;
    data: T | null;

    constructor(
        status: HttpStatusCode,
        message: string,
        data: T | null = null
    ) {
        this.status = status;
        this.message = message;
        this.data = data;
    }
}

/**
 * API response helper
 */
export function apiResponse<T>(
    res: Response,
    status: HttpStatusCode,
    message: string,
    data: T | null = null
): Response {
    return res.status(status).json(
        new ApiResponse<T>(status, message, data)
    );
}
