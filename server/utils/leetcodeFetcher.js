import fetch from 'node-fetch';

let cachedProblems = null;

/**
 * Fetches and caches the list of all free LeetCode problems
 */
const fetchAllProblems = async () => {
    if (cachedProblems) return cachedProblems;

    try {
        const response = await fetch('https://leetcode.com/api/problems/algorithms/');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const medium = data.stat_status_pairs.filter(p => p.difficulty.level === 2 && !p.paid_only);
        const hard = data.stat_status_pairs.filter(p => p.difficulty.level === 3 && !p.paid_only);
        
        cachedProblems = { medium, hard };
        return cachedProblems;
    } catch (error) {
        console.error('Error fetching LeetCode problems:', error);
        // Fallback data in case the API is blocked or down
        return {
            medium: [{ stat: { question__title: 'Two Sum II - Input Array Is Sorted', question__title_slug: 'two-sum-ii-input-array-is-sorted' } }],
            hard: [{ stat: { question__title: 'Median of Two Sorted Arrays', question__title_slug: 'median-of-two-sorted-arrays' } }]
        };
    }
};

/**
 * Returns a random problem of the specified difficulty
 * @param {string} difficulty 'medium' or 'hard'
 */
export const getRandomLeetcodeProblem = async (difficulty) => {
    const problems = await fetchAllProblems();
    const list = difficulty === 'medium' ? problems.medium : problems.hard;
    
    if (!list || list.length === 0) {
        return difficulty === 'medium' 
            ? { title: 'Two Sum', slug: 'two-sum' }
            : { title: 'Median of Two Sorted Arrays', slug: 'median-of-two-sorted-arrays' };
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    const problem = list[randomIndex];

    return {
        title: problem.stat.question__title,
        slug: problem.stat.question__title_slug,
        url: `https://leetcode.com/problems/${problem.stat.question__title_slug}/`
    };
};

/**
 * Verifies if a user has a recent accepted submission for a specific problem
 * @param {string} username LeetCode username
 * @param {string} problemSlug The title slug of the problem to verify
 * @param {Date} startTime The time the round started (only submissions after this count)
 */
export const verifySubmission = async (username, problemSlug, startTime) => {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          titleSlug
          timestamp
        }
      }
    `;

    try {
        const response = await fetch('https://leetcode.com/graphql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                query: query,
                variables: { username, limit: 15 },
            }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (!data || !data.data || !data.data.recentAcSubmissionList) {
            console.error('Unexpected response format from LeetCode GraphQL', data);
            return false;
        }

        const submissions = data.data.recentAcSubmissionList;
        const startTimestamp = Math.floor(startTime.getTime() / 1000);

        // Check if there is an accepted submission for this slug AFTER the start time
        const match = submissions.find(sub => 
            sub.titleSlug === problemSlug && 
            parseInt(sub.timestamp) >= startTimestamp
        );

        return !!match;

    } catch (error) {
        console.error('Error verifying LeetCode submission:', error);
        return false;
    }
};

/**
 * Fetches the HTML content/description for a given LeetCode problem slug
 * @param {string} titleSlug 'two-sum', etc.
 */
export const getProblemContent = async (titleSlug) => {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          content
        }
      }
    `;

    try {
        const response = await fetch('https://leetcode.com/graphql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                query: query,
                variables: { titleSlug },
                operationName: 'questionData'
            }),
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        return data?.data?.question?.content || null;

    } catch (error) {
        console.error('Error fetching LeetCode problem content:', error);
        return null;
    }
};
