import axios from 'axios';

/**
 * Fetches public repositories for a given GitHub username
 * @param {String} username - GitHub username
 */
export const fetchUserRepositories = async (username) => {
  try {
    const config = {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      }
    };
    
    // Add token if available
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here') {
      config.headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, config);
    
    // Simplify the repo data
    return response.data.map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      url: repo.html_url,
      stars: repo.stargazers_count
    }));
  } catch (error) {
    console.error(`Error fetching GitHub repos for ${username}:`, error.message);
    return []; // Return empty array if user not found or error
  }
};
