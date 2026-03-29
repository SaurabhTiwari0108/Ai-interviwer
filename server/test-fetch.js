import { getRandomProblem } from './utils/excelParser.js';
import { getProblemContent } from './utils/leetcodeFetcher.js';

async function test() {
    const prob = getRandomProblem();
    console.log("Extracted Problem:", prob);
    
    let content = '';
    let extractedFromLC = false;
    try {
        if (prob.url && prob.url.includes('leetcode.com/problems/')) {
            const slug = prob.url.split('/problems/')[1].split('/')[0].split('?')[0];
            console.log("Parsed Slug:", slug);
            const lcData = await getProblemContent(slug);
            if (lcData) {
                console.log("Successfully fetched LC Data. Length:", lcData.length);
                content = lcData;
                extractedFromLC = true;
            } else {
                console.log("LC Data came back null.");
            }
        } else {
            console.log("Missing URL or not LeetCode.");
        }
    } catch(e) {
        console.error("Error in getDesc:", e);
    }
    console.log("Final Extracted From LC:", extractedFromLC);
}
test();
