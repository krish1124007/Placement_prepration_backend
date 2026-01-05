import axios from 'axios';

export interface GitHubUserInfo {
    id: number;
    login: string; // username
    name: string;
    email: string;
    avatar_url: string;
    bio: string;
    public_repos: number;
    followers: number;
    following: number;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string;
    topics: string[];
    created_at: string;
    updated_at: string;
}

/**
 * Exchange GitHub authorization code for access token
 * @param code - The authorization code from GitHub
 * @returns Access token
 */
export const exchangeGitHubCode = async (code: string): Promise<string> => {
    try {
        const response = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
            },
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        if (!response.data.access_token) {
            throw new Error('Failed to get access token from GitHub');
        }

        return response.data.access_token;
    } catch (error: any) {
        throw new Error(`GitHub token exchange failed: ${error.message}`);
    }
};

/**
 * Get GitHub user information using access token
 * @param accessToken - GitHub access token
 * @returns User information
 */
export const getGitHubUser = async (accessToken: string): Promise<GitHubUserInfo> => {
    try {
        const response = await axios.get<GitHubUserInfo>(
            'https://api.github.com/user',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        throw new Error(`Failed to get GitHub user: ${error.message}`);
    }
};

/**
 * Get user's GitHub repositories
 * @param accessToken - GitHub access token
 * @param username - GitHub username
 * @returns Array of repositories
 */
export const getGitHubRepos = async (accessToken: string, username: string): Promise<GitHubRepo[]> => {
    try {
        const response = await axios.get<GitHubRepo[]>(
            `https://api.github.com/users/${username}/repos`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                params: {
                    sort: 'updated',
                    per_page: 100,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        throw new Error(`Failed to get GitHub repos: ${error.message}`);
    }
};
