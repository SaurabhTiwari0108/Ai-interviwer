import { GoogleGenAI } from '@google/genai';
import { getRandomProblem, getRandomAptitudeProblems } from '../utils/excelParser.js';
import { getProblemContent } from '../utils/leetcodeFetcher.js';
import TurndownService from 'turndown';

const turndownService = new TurndownService({ codeBlockStyle: 'fenced' });

let aiConfigured = false;
let ai;

const getAIClient = () => {
  if (!aiConfigured) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY is missing or invalid. Responses will be simulated.');
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
    aiConfigured = true;
  }
  return ai;
};

/**
 * Extracts basic profile info (name, skills, github) from resume text
 */
export const extractProfileFromResume = async (resumeText) => {
  const client = getAIClient();
  
  if (!client) {
    // Fallback if no API key
    return {
      name: "John Doe",
      skills: ["JavaScript", "React", "Node.js"],
      githubUsername: "johndoe",
      githubProfileUrl: "https://github.com/johndoe"
    };
  }

  try {
    const prompt = `
      Analyze the following resume text and extract:
      1. Full Name
      2. List of technical skills and technologies
      3. GitHub Profile URL (if present)
      4. GitHub username (extracted from the URL)
      5. LinkedIn Profile URL (if present)
      6. A list of their work experience/roles
      7. A list of their projects (titles and brief functionality)
      8. A list of their education degrees
      
      Return ONLY a JSON object with this exact structure:
      {
        "name": "Jane Doe",
        "skills": ["Python", "Machine Learning", "AWS"],
        "experience": ["Software Engineer at Google (2020-2022)", "Intern at Meta"],
        "education": ["B.Tech Computer Science from MIT"],
        "projects": ["E-commerce MERN App", "AI Chatbot"],
        "githubProfileUrl": "https://github.com/janedoe",
        "githubUsername": "janedoe",
        "linkedinProfileUrl": "https://linkedin.com/in/janedoe"
      }
      
      Resume Text:
      ${resumeText.substring(0, 15000)}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error (Likely Rate Limit Exceeded). Using fallback response.');
    return {
      name: "API Quota Exceeded User",
      skills: ["Google Gemini Rate Limit Exhausted"],
      experience: [],
      education: [],
      projects: [],
      githubUsername: "",
      githubProfileUrl: ""
    };
  }
};

const cleanHTML = (html) => {
   if (!html) return '';
   // Prefix relative image paths with base LeetCode URL
   let fixedHtml = html.replace(/src="\/uploads\//g, 'src="https://leetcode.com/uploads/');
   fixedHtml = fixedHtml.replace(/src='\/uploads\//g, "src='https://leetcode.com/uploads/");
   return turndownService.turndown(fixedHtml);
};

/**
 * Generates interview questions specific to the current round
 */
export const generateQuestionsForRound = async (roundNumber, profileName, skills, repos, resumeText) => {
    const getDesc = async (prob) => {
        let content = '';
        let extractedFromLC = false;
        try {
            if (prob.url && prob.url.includes('leetcode.com/problems/')) {
                const slug = prob.url.split('/problems/')[1].split('/')[0].split('?')[0];
                const lcData = await getProblemContent(slug);
                if (lcData) {
                    content = lcData;
                    extractedFromLC = true;
                }
            }
        } catch(e) {}
        return { content: content || prob.title, extractedFromLC };
    };

  const client = getAIClient();
  
  if (!client) {
    console.warn('GEMINI_API_KEY is missing or invalid. Responses will be simulated.');
    
    if (roundNumber === 1) {
      const problem1 = getRandomProblem();
      const problem2 = getRandomProblem();
      
      const desc1 = await getDesc(problem1);
      const desc2 = await getDesc(problem2);
      
      // Use cleanHTML to preserve markdown and image links
      const clean1 = desc1.content ? cleanHTML(desc1.content) : problem1.title;
      const clean2 = desc2.content ? cleanHTML(desc2.content) : problem2.title;

      return [
        { question: clean1, category: "Data Structures", difficulty: "Medium/Hard", leetcodeUrl: problem1.url },
        { question: clean2, category: "Data Structures", difficulty: "Medium/Hard", leetcodeUrl: problem2.url }
      ];
    } else if (roundNumber === 2) {
      const apts = getRandomAptitudeProblems(5);
      return apts.map(a => {
          const base = Math.floor(Math.random() * 50) + 10;
          let opts = [base.toString(), (base+5).toString(), (base-5).toString(), "None of the above"];
          opts.sort(() => Math.random() - 0.5);
          return {
            question: a.question,
            options: opts,
            correctAnswer: base.toString(),
            category: a.topic,
            difficulty: a.difficulty
          };
      });
    } else if (roundNumber === 3) {
      const problem = getRandomProblem();
      const desc = await getDesc(problem);
      const cleanDesc = desc.content ? cleanHTML(desc.content) : problem.title;

      return [{
        question: `**Explain the algorithmic approach verbally for: ${problem.title}**\n\n${cleanDesc}`,
        category: "Voice Algorithm",
        difficulty: "Hard",
        leetcodeUrl: problem.url
      }];
    } else if (roundNumber === 4) {
       return [
         { question: "How many projects are listed in the resume, and what are their names?", category: "Behavioral", difficulty: "Easy" },
         { question: "What specific technologies, frameworks, or languages were used across these projects?", category: "Behavioral", difficulty: "Medium" },
         { question: "Can you explain the core functionality and your role in building these projects?", category: "Behavioral", difficulty: "Medium" },
         { question: "What technical challenges did you face while building them?", category: "Behavioral", difficulty: "Hard" },
         { question: "Out of all the projects, which one do you consider your 'best' or most impressive project, and why?", category: "Behavioral", difficulty: "Medium" }
       ];
    } else if (roundNumber === 5) {
       return [
         { question: "For your most impressive project, describe the high-level architecture and how different components interact.", category: "System Design", difficulty: "Hard" },
         { question: "What factors influenced your choice of database or data storage for that project, and how does it scale?", category: "System Design", difficulty: "Hard" },
         { question: "If you had to rebuild your best project to handle 10x the traffic, what architectural changes would you make?", category: "System Design", difficulty: "Hard" }
       ];
    }
  }

  let r1p1, r1p2, r1d1, r1d2, r3p1, r3d1;

  try {
    const repoContext = repos && repos.length > 0 
      ? `Their GitHub repositories: ${repos.map(r => r.name + (r.language ? ` (${r.language})` : '')).join(', ')}.` 
      : 'No specific GitHub repositories provided.';
      
    let prompt = '';

    if (roundNumber === 1) {
      r1p1 = getRandomProblem();
      r1p2 = getRandomProblem();
      
      r1d1 = await getDesc(r1p1);
      r1d2 = await getDesc(r1p2);
      
      let extractionInstruction = `
        For Problem 1, you are given ${r1d1.extractedFromLC ? 'its exact HTML description. Strip the HTML and return clean Markdown' : 'only its title. You must GENERATE a full comprehensive coding problem description in Markdown with constraints and examples'}.
        For Problem 2, you are given ${r1d2.extractedFromLC ? 'its exact HTML description. Strip the HTML and return clean Markdown' : 'only its title. You must GENERATE a full comprehensive coding problem description in Markdown with constraints and examples'}.
      `;
      
      prompt = `
        You are an expert technical interviewer. Candidate ${profileName} has skills: ${skills.join(', ')}.
        This is Round ${roundNumber}: Data Structures and Algorithms.
        The candidate must solve exactly these two problems:
        
        Problem 1: "${r1p1.title}" (Link: ${r1p1.url})
        Description Input 1: 
        \`\`\`
        ${r1d1.content}
        \`\`\`

        Problem 2: "${r1p2.title}" (Link: ${r1p2.url})
        Description Input 2:
        \`\`\`
        ${r1d2.content}
        \`\`\`

        ${extractionInstruction}

        Your task is to DO NOTHING to the provided problem descriptions narrative. We will use the exact scraped text over on the frontend.
        Your ONLY job is to generate 3-5 rigorous test cases for EACH problem that can be executed natively in JavaScript via a function call, and determine the category/difficulty.
        Return ONLY a JSON array:
        [
          { 
            "category": "Data Structures", 
            "difficulty": "Medium/Hard", 
            "testCases": [
               { "input": "[2,7,11,15], 9", "expectedOutput": "[0,1]" }
            ]
          },
          { 
            "category": "Data Structures", 
            "difficulty": "Medium/Hard", 
            "testCases": [
               { "input": "...", "expectedOutput": "..." }
            ]
          }
        ]
      `;
    } else if (roundNumber === 2) {
       const apts = getRandomAptitudeProblems(10);
       const aptString = apts.map((a, i) => `Q${i+1} [${a.topic} | ${a.difficulty}]: ${a.question}`).join('\n');
       
       prompt = `
         You are an expert technical interviewer evaluating candidate ${profileName}.
         This is Round 2: Aptitude Assessment.
         I have the following raw aptitude questions extracted from our test bank:
         
         ${aptString}
         
         For EACH question, you must generate 4 plausible multiple-choice options (these should be actual potential answers to the math/logic question, e.g., "15", "20", "25", "None of the above"), and logically determine the ONE correct answer among those options.
         Return ONLY a JSON array of exactly ${apts.length} objects representing these questions.
         Format EXACTLY as:
         [
           {
              "question": "The full question text",
              "options": ["Actual Answer 1", "Actual Answer 2", "Actual Answer 3", "Actual Answer 4"],
              "correctAnswer": "The exact string of the correct actual answer",
              "category": "Topic of the question",
              "difficulty": "Easy/Medium/Hard"
           }
         ]
         IMPORTANT: DO NOT wrap your response in \`\`\`json. Return pure raw JSON.
       `;
    } else if (roundNumber === 3) {
      r3p1 = getRandomProblem();
      r3d1 = await getDesc(r3p1);

      prompt = `
        You are an expert technical interviewer. Candidate ${profileName} has skills: ${skills.join(', ')}.
        This is Round 3: Interactive Code & Voice Explanation.
        The candidate must solve and verbally explain their approach to this HARD difficulty level problem: "${r3p1.title}" (Link: ${r3p1.url}).

        Generate exactly 1 technical question prompting the user to solve this problem and explain their code logic verbally.
        Return ONLY a JSON array of objects:
        [{ "question": "Placeholder text", "category": "Voice Algorithm", "difficulty": "Hard", "leetcodeUrl": "${r3p1.url}" }]
      `;
    } else if (roundNumber === 4) {
      prompt = `
        You are an expert technical recruiter interviewing candidate ${profileName}.
        This is Round 4: Resume & Behavioral Review.
        Below is the text extracted from their resume:
        """
        ${resumeText ? resumeText.substring(0, 3000) : "No resume text available, base questions on skills: " + skills.join(', ')}
        """
        You must generate exactly 5 conceptual interview questions based ONLY on this resume. The 5 questions must specifically ask:
        1. How many projects are listed in the resume, and what are their names?
        2. What specific technologies, frameworks, or languages were used across these projects?
        3. Can you explain the core functionality and your role in building these projects?
        4. What technical challenges did you face while building them?
        5. Out of all the projects, which one do you consider your 'best' or most impressive project, and why?
        
        Return ONLY a JSON array of objects formatted like this:
        [{ "question": "Question text...", "category": "Behavioral", "difficulty": "Medium" }]
      `;
    } else if (roundNumber === 5) {
      prompt = `
        You are a Senior System Architect interviewing candidate ${profileName}.
        This is Round 5: Project Deep Dive.
        ${repoContext}
        Additionally, here is their resume text extract:
        """
        ${resumeText ? resumeText.substring(0, 3000) : "No resume text available."}
        """
        Assuming the candidate previously selected their 'best' or most complex project from this resume, generate exactly 3 deep, architectural, or analytical system design questions targeting that most impressive project. 
        Ask deeply about its technological choices, database design, scaling, or structural implementations.
        Return ONLY a JSON array of objects:
        [{ "question": "Question text...", "category": "System Design", "difficulty": "Hard" }]
      `;
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```json')) {
       rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
       rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    let parsedData = JSON.parse(rawText);

    if (roundNumber === 1 && Array.isArray(parsedData) && parsedData.length === 2) {
       parsedData[0].question = `**${r1p1.title}**\n\n${cleanHTML(r1d1.content)}`;
       parsedData[0].leetcodeUrl = r1p1.url;
       parsedData[1].question = `**${r1p2.title}**\n\n${cleanHTML(r1d2.content)}`;
       parsedData[1].leetcodeUrl = r1p2.url;
    }

    if (roundNumber === 3 && Array.isArray(parsedData) && parsedData.length === 1 && r3p1) {
       parsedData[0].question = `**${r3p1.title}**\n\n${cleanHTML(r3d1.content)}`;
       parsedData[0].leetcodeUrl = r3p1.url;
    }

    return parsedData;
  } catch (error) {
    console.warn('API Error on Question Generation. Using fallback simulated questions.');
    // Simulated Fallback
    if (roundNumber === 1) {
       const cleanD1 = r1d1?.content ? cleanHTML(r1d1.content).substring(0, 1500) : "Could not scrape LeetCode HTML. Please use the URL provided to read the issue.";
       const cleanD2 = r1d2?.content ? cleanHTML(r1d2.content).substring(0, 1500) : "Could not scrape LeetCode HTML. Please use the URL provided to read the issue.";
       return [
          { "question": `**${r1p1?.title || 'Problem 1'}**\n\n${cleanD1}`, "category": "Data Structures", "difficulty": "Medium/Hard", "testCases": [{ "input": "[1,2,3]", "expectedOutput": "6"}] },
          { "question": `**${r1p2?.title || 'Problem 2'}**\n\n${cleanD2}`, "category": "Data Structures", "difficulty": "Medium/Hard", "testCases": [{ "input": "[]", "expectedOutput": "0"}] }
       ];
    } else if (roundNumber === 2) {
       return getRandomAptitudeProblems(5).map(a => {
           const base = Math.floor(Math.random() * 50) + 10;
           let opts = [base.toString(), (base+5).toString(), (base-5).toString(), "Cannot be determined"];
           opts.sort(() => Math.random() - 0.5);
           return {
             question: a.question,
             options: opts,
             correctAnswer: base.toString(),
             category: a.topic,
             difficulty: a.difficulty
           };
       });
    } else if (roundNumber === 3) {
       const cleanD1 = r3d1?.content ? cleanHTML(r3d1.content).substring(0, 1500) : "Could not scrape LeetCode HTML.";
       return [
          { "question": `**${r3p1?.title || 'System Design Problem'}**\n\n${cleanD1}`, "category": "Voice Algorithm", "difficulty": "Hard", "leetcodeUrl": r3p1?.url }
       ];
    } else if (roundNumber === 4) {
       return [
         { question: "How many projects are listed in the resume, and what are their names?", category: "Behavioral", difficulty: "Easy" },
         { question: "What specific technologies, frameworks, or languages were used across these projects?", category: "Behavioral", difficulty: "Medium" },
         { question: "Can you explain the core functionality and your role in building these projects?", category: "Behavioral", difficulty: "Medium" },
         { question: "What technical challenges did you face while building them?", category: "Behavioral", difficulty: "Hard" },
         { question: "Out of all the projects, which one do you consider your 'best' or most impressive project, and why?", category: "Behavioral", difficulty: "Medium" }
       ];
    } else if (roundNumber === 5) {
       return [
         { question: "For your most impressive project, describe the high-level architecture and how different components interact.", category: "System Design", difficulty: "Hard" },
         { question: "What factors influenced your choice of database or data storage for that project, and how does it scale?", category: "System Design", difficulty: "Hard" },
         { question: "If you had to rebuild your best project to handle 10x the traffic, what architectural changes would you make?", category: "System Design", difficulty: "Hard" }
       ];
    }
  }
};

/**
 * Evaluates candidate's answer to a question
 */
export const evaluateAnswer = async (question, answer) => {
  const client = getAIClient();
  
  if (!client) {
    // Fallback if no API key
    return {
      technicalScore: 8,
      clarityScore: 7,
      improvementSuggestions: "Good answer. Could provide more specific examples next time."
    };
  }

  try {
    const prompt = `
      You are an expert technical interviewer evaluating a candidate's answer.
      
      Question asked: "${question}"
      Candidate's answer: "${answer}"
      
      Evaluate the answer and provide:
      1. Technical Score (1-10): How technically accurate and complete is the answer?
      2. Clarity Score (1-10): How clear and well-structured is the explanation?
      3. Improvement Suggestions: A concise 1-2 sentence tip on how they could improve their answer.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 8,
        "clarityScore": 7,
        "improvementSuggestions": "Your technical explanation was good, but mentioning specific use cases would improve clarity."
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error on Answer Evaluation. Using fallback.');
    return {
      technicalScore: 7,
      clarityScore: 7,
      improvementSuggestions: "Simulated response: Try to be more detailed."
    };
  }
};

/**
 * Evaluates candidate's contextual answer (e.g. Resume or Project)
 */
export const evaluateContextualAnswer = async (question, answer, contextText) => {
  const client = getAIClient();
  
  if (!client) {
    return {
      technicalScore: 8,
      clarityScore: 7,
      improvementSuggestions: "Simulated response: Ensure your answers align directly with your resume."
    };
  }

  try {
    const prompt = `
      You are an expert technical interviewer evaluating a candidate's verbal answer.
      
      Resume / Profile Context:
      """
      ${contextText}
      """

      Question asked: "${question}"
      Candidate's verbal answer: "${answer}"
      
      Evaluate the answer specifically checking if it logically aligns with their Resume/Profile Context and answers the question well. Provide:
      1. Technical/Relevance Score (1-10): Is the answer factually sound and relevant to what is in their resume?
      2. Clarity Score (1-10): How clear and well-structured is the explanation?
      3. Improvement Suggestions: A concise tip on how they could improve. If their answer completely contradicted their resume, point it out.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 8,
        "clarityScore": 7,
        "improvementSuggestions": "..."
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error on Contextual Evaluation. Using fallback.');
    return {
      technicalScore: 8,
      clarityScore: 7,
      improvementSuggestions: "Simulated response: Ensure your answers align directly with your resume/projects."
    };
  }
};

/**
 * Evaluates Round 3 Coding + Verbal Explanation
 */
export const evaluateCodeAndExplanation = async (question, code, explanation) => {
  const client = getAIClient();
  
  if (!client) {
    return {
      technicalScore: 10,
      clarityScore: 10,
      improvementSuggestions: "Simulated response: Logic matches code."
    };
  }

  try {
    const prompt = `
      You are an expert technical interviewer evaluating Round 3: Coding + Verbal Explanation.
      
      Problem: "${question}"
      Candidate's Code Logic:
      \`\`\`
      ${code}
      \`\`\`
      
      Candidate's Verbal Explanation (Transcribed):
      "${explanation}"
      
      Evaluate both the code correctness and whether the verbal explanation actually matches the written code.
      ALSO, generate 1 follow-up question to probe their understanding deeper (e.g. "What is the time complexity?", "Can this be optimized?", or "Why did you choose this exact approach over another?").

      1. Technical Score (1-10): How technically accurate is the code?
      2. Clarity Score (1-10): Does the explanation logically match the code they wrote? How clear is it?
      3. Improvement Suggestions: A concise 1-2 sentence tip.
      4. followUpQuestion: The generated follow-up question.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 9,
        "clarityScore": 8,
        "improvementSuggestions": "...",
        "followUpQuestion": "What is the time complexity of your approach?"
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error on Code & Explanation Evaluation. Using fallback.');
    return {
      technicalScore: 10,
      clarityScore: 10,
      improvementSuggestions: "Simulated response: Logic matches code.",
      followUpQuestion: "What is the time complexity of your implementation?"
    };
  }
};

/**
 * Evaluates candidate's answer to the follow-up question in Round 3
 */
export const evaluateFollowUpAnswer = async (question, code, followUpQuestion, followUpAnswer) => {
  const client = getAIClient();
  
  if (!client) {
    return {
      technicalScore: 10,
      clarityScore: 10,
      improvementSuggestions: "Simulated response: Great explanation of the follow-up."
    };
  }

  try {
    const prompt = `
      You are an expert technical interviewer evaluating Round 3: Coding + Verbal Explanation (Follow-up part).
      
      Original Problem: "${question}"
      Candidate's Code:
      \`\`\`
      ${code}
      \`\`\`
      
      Follow-up Question asked: "${followUpQuestion}"
      Candidate's Answer: "${followUpAnswer}"
      
      Evaluate their follow-up answer in context of their code.
      1. Technical Score (1-10): How technically accurate is their follow-up answer?
      2. Clarity Score (1-10): How clearly did they articulate it?
      3. Improvement Suggestions: A concise 1-2 sentence final tip for this problem.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 9,
        "clarityScore": 8,
        "improvementSuggestions": "..."
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error on FollowUp Evaluation. Using fallback.');
    return {
      technicalScore: 10,
      clarityScore: 10,
      improvementSuggestions: "Simulated response: Valid follow-up explanation."
    };
  }
};

/**
 * Evaluates the entire interview to generate a complete feedback report
 */
export const generateFinalFeedback = async (interviewData) => {
  const client = getAIClient();
  
  if (!client) {
    return {
      strengths: ["Problem-solving", "Good logic flow"],
      weaknesses: ["Verbal articulation", "Code optimization"],
      improvementSuggestions: "Practice data structures more.",
      overallComments: "Simulated feedback: Good performance overall, but keep practicing."
    };
  }

  try {
    const stringifiedData = JSON.stringify(interviewData.rounds.map(r => ({
      round: r.roundNumber,
      title: r.title,
      score: r.score,
      questions: r.questions.map(q => ({
        question: q.question,
        score: q.feedback?.technicalScore || 0,
        suggestions: q.feedback?.improvementSuggestions || ''
      }))
    })));

    const prompt = `
      You are an expert technical recruiter analyzing a candidate's complete 5-round interview performance.
      
      Interview Results Data:
      ${stringifiedData}
      
      Generate a complete interview feedback report based on all 5 rounds. Use the scores and suggestions to deduce their competency.
      
      Return ONLY a JSON object with this exact structure:
      {
        "strengths": ["...","..."],
        "weaknesses": ["...","..."],
        "improvementSuggestions": "Detailed paragraph on how to improve on their weaknesses (e.g. DSA, Communication, System Design)...",
        "overallComments": "A brief summary of their overall interview."
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error on Final Feedback Generation. Using fallback.');
    return {
      strengths: ["General Problem Solving", "Basic Web Development knowledge"],
      weaknesses: ["Advanced DSA concepts", "Communication under pressure"],
      improvementSuggestions: "Focus on practicing optimal approaches and clearly verbalizing logic before writing code.",
      overallComments: "Simulated response: A solid performance but needs refinement in advanced optimization."
    };
  }
};

/**
 * Evaluates a code solution based on correctness and time/space complexity
 */
export const evaluateCode = async (question, code, language = 'javascript') => {
  const client = getAIClient();
  
  if (!client) {
    return {
      technicalScore: 10,
      clarityScore: 10,
      improvementSuggestions: "Simulated response: Optimal solution detected."
    };
  }

  try {
    const prompt = `
      You are an expert technical interviewer evaluating a candidate's code solution to a coding problem.
      
      Problem Description: "${question}"
      Candidate's Code (${language}):
      \`\`\`
      ${code}
      \`\`\`
      
      Evaluate the code and provide:
      1. Technical Score (1-10): How technically accurate and functionally correct is the code? Give 10/10 if the solution is completely correct, logically sound, and handles edge cases. If it's incorrect, penalize severely.
      2. Time/Space Complexity Score (1-10): Evaluate the time and space complexity efficiency. Give 10/10 if the approach is optimal (best proven time complexity for this specific problem). If it's a brute force or sub-optimal, give lower scores.
      3. Improvement Suggestions: A concise 1-2 sentence tip on how they could improve their code, specifically if there is a more optimal approach available.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 8,
        "clarityScore": 7, 
        "improvementSuggestions": "Your code is completely correct, but an O(n) approach using a hash map would be more optimal in time complexity."
      }
      Note: We map the Time Complexity score to "clarityScore" to fit the frontend data structure.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn('API Error on Code Evaluation. Using fallback.');
    return {
      technicalScore: 8,
      clarityScore: 8,
      improvementSuggestions: "Simulated response: Code syntax is roughly acceptable."
    };
  }
};

