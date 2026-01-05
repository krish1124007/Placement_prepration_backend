import axios from 'axios';

export interface GoogleUserInfo {
    sub: string; // Google user ID
    email: string;
    email_verified: boolean;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
}

/**
 * Verify Google access token and get user information
 * @param accessToken - The access token received from Google OAuth
 * @returns User information from Google
 */
export const verifyGoogleToken = async (accessToken: string): Promise<GoogleUserInfo> => {
    try {
        const response = await axios.get<GoogleUserInfo>(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.data || !response.data.email) {
            throw new Error('Invalid token or user data');
        }

        return response.data;
    } catch (error: any) {
        throw new Error(`Google token verification failed: ${error.message}`);
    }
};
