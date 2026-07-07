import { getRandomProblem, getRandomAptitudeProblems } from '../utils/excelParser.js';
import { getProblemContent } from '../utils/leetcodeFetcher.js';
import TurndownService from 'turndown';
import fetch from 'node-fetch'; // fetch is globally available in Node 18, but just in case. Or rely on global fetch.

// In modern Node.js, fetch is available globally.
// If using older version, you might need to install and import node-fetch.
// assuming Node > 18 for this app based on Gemini's usage.
const turndownService = new TurndownService({ codeBlockStyle: 'fenced' });

/**
 * Reusable backend function for Hybrid AI System.
 * First try Groq API, then fallback to OpenRouter.
 */
export const askAI = async (prompt, isJSON = true) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  
  if (!groqApiKey && !openRouterApiKey) {
     console.warn('Both GROQ_API_KEY and OPENROUTER_API_KEY are missing. Returning fallback.');
     throw new Error("No API keys configured");
  }

  // Common message config
  const messages = [
    { role: "user", content: prompt }
  ];

  // Attempt Groq API First
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        ...(isJSON && { response_format: { type: "json_object" } })
      })
    });

    if (!groqResponse.ok) {
       throw new Error(`Groq API Error: ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    let text = data.choices[0].message.content.trim();
    
    if (isJSON) {
        return parseJSONSafely(text);
    }
    return text;
  } catch (groqError) {
    console.warn(`Groq failed (${groqError.message}). Falling back to OpenRouter API...`);
    
    // Attempt OpenRouter API Fallback
    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
        })
      });

      if (!openRouterResponse.ok) {
         throw new Error(`OpenRouter API Error: ${openRouterResponse.status}`);
      }
      
      const data = await openRouterResponse.json();
      let text = data.choices[0].message.content.trim();
      
      if (isJSON) {
          return parseJSONSafely(text);
      }
      return text;
    } catch (openRouterError) {
       console.error(`Hybrid AI failed entirely. OpenRouter error: ${openRouterError.message}`);
       throw new Error("AI service is temporarily unavailable. Please try again.");
    }
  }
};

const parseJSONSafely = (rawText) => {
    let text = rawText;
    if (text.startsWith('```json')) {
       text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
       text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(text);
};


/**
 * Extracts basic profile info (name, skills, github) from resume text
 */
export const extractProfileFromResume = async (resumeText) => {
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

    return await askAI(prompt, true);
  } catch (error) {
    console.warn('API Error. Using fallback response.');
    return {
      name: "API Quota Exceeded User",
      skills: ["Hybrid AI System Fallback Response"],
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

        Your ONLY job is to generate 3-5 rigorous test cases for EACH problem that can be executed natively in JavaScript via a function call, and determine the category/difficulty.
        Return ONLY a JSON array with {"data": [...] } format. Inside "data" array:
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
         
         For EACH question, you must generate 4 plausible multiple-choice options (these should be actual potential answers to the math/logic question), and logically determine the ONE correct answer among those options.
         Return ONLY a JSON object with this exact structure:
         {
           "data": [
             {
                "question": "The full question text",
                "options": ["Actual Answer 1", "Actual Answer 2", "Actual Answer 3", "Actual Answer 4"],
                "correctAnswer": "The exact string of the correct actual answer",
                "category": "Topic of the question",
                "difficulty": "Easy/Medium/Hard"
             }
           ]
         }
       `;
    } else if (roundNumber === 3) {
      r3p1 = getRandomProblem();
      r3d1 = await getDesc(r3p1);

      prompt = `
        You are an expert technical interviewer. Candidate ${profileName} has skills: ${skills.join(', ')}.
        This is Round 3: Interactive Code & Voice Explanation.
        The candidate must solve and verbally explain their approach to this HARD difficulty level problem: "${r3p1.title}" (Link: ${r3p1.url}).

        Generate exactly 1 technical question prompting the user to solve this problem and explain their code logic verbally.
        Return ONLY a JSON object:
        { "data": [{ "question": "Placeholder text", "category": "Voice Algorithm", "difficulty": "Hard", "leetcodeUrl": "${r3p1.url}" }] }
      `;
    } else if (roundNumber === 4) {
      prompt = `
        You are an expert technical recruiter interviewing candidate ${profileName}.
        This is Round 4: Resume & Behavioral Review.
        Below is the text extracted from their resume:
        """
        ${resumeText ? resumeText.substring(0, 3000) : "No resume text available, base questions on skills: " + skills.join(', ')}
        """
        You must generate exactly 5 conceptual interview questions based ONLY on this resume. 
        Focus on projects, technologies used, technical challenges faced, core functionality of their listed projects.
        
        Return ONLY a JSON object formatted like this:
        { "data": [{ "question": "Question text...", "category": "Behavioral", "difficulty": "Medium" }] }
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
        Return ONLY a JSON object:
        { "data": [{ "question": "Question text...", "category": "System Design", "difficulty": "Hard" }] }
      `;
    }

    const parsedResponse = await askAI(prompt, true);
    let parsedData = parsedResponse.data || (Array.isArray(parsedResponse) ? parsedResponse : []);
    
    // In case the AI ignores the JSON object wrapper instruction and returns just the array.
    if (!Array.isArray(parsedData) && Object.keys(parsedResponse).length > 0 && Array.isArray(Object.values(parsedResponse)[0])) {
         parsedData = Object.values(parsedResponse)[0];
    }
    
    // Ensure parsedData is definitively an array. If the AI returns a string or an object with no array, throw an error to trigger the fallback mechanisms.
    if (!Array.isArray(parsedData)) {
         throw new Error("AI response was mapped to Non-Array output.");
    }
    
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
    console.warn('API Error on Question Generation. Using fallback simulated questions.', error.message);
    // Simulated Fallback
    if (roundNumber === 1) {
       const cleanD1 = r1d1?.content ? cleanHTML(r1d1.content).substring(0, 1500) : "Could not scrape LeetCode HTML.";
       const cleanD2 = r1d2?.content ? cleanHTML(r1d2.content).substring(0, 1500) : "Could not scrape LeetCode HTML.";
       return [
          { "question": `**${r1p1?.title || 'Problem 1'}**\n\n${cleanD1}`, "category": "Data Structures", "difficulty": "Medium/Hard", "testCases": [{ "input": "[1,2,3]", "expectedOutput": "6"}] },
          { "question": `**${r1p2?.title || 'Problem 2'}**\n\n${cleanD2}`, "category": "Data Structures", "difficulty": "Medium/Hard", "testCases": [{ "input": "[]", "expectedOutput": "0"}] }
       ];
    } else if (roundNumber === 2) {
       return getRandomAptitudeProblems(5).map(a => {
           const base = Math.floor(Math.random() * 50) + 10;
           let opts = [base.toString(), (base+5).toString(), (base-5).toString(), "Cannot be determined"];
           opts.sort(() => Math.random() - 0.5);
           return { question: a.question, options: opts, correctAnswer: base.toString(), category: a.topic, difficulty: a.difficulty };
       });
    } else if (roundNumber === 3) {
       const cleanD1 = r3d1?.content ? cleanHTML(r3d1.content).substring(0, 1500) : "Could not scrape LeetCode HTML.";
       return [{ "question": `**${r3p1?.title || 'System Design Problem'}**\n\n${cleanD1}`, "category": "Voice Algorithm", "difficulty": "Hard", "leetcodeUrl": r3p1?.url }];
    } else if (roundNumber === 4) {
       return [
         { question: "How many projects are listed in the resume, and what are their names?", category: "Behavioral", difficulty: "Easy" },
         { question: "What specific technologies, frameworks, or languages were used across these projects?", category: "Behavioral", difficulty: "Medium" },
         { question: "Can you explain the core functionality and your role in building these projects?", category: "Behavioral", difficulty: "Medium" }
       ];
    } else if (roundNumber === 5) {
       return [
         { question: "For your most impressive project, describe the high-level architecture and how different components interact.", category: "System Design", difficulty: "Hard" },
         { question: "What factors influenced your choice of database or data storage for that project, and how does it scale?", category: "System Design", difficulty: "Hard" }
       ];
    }
  }
};

/**
 * Evaluates candidate's answer to a question
 */
export const evaluateAnswer = async (question, answer) => {
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
        "improvementSuggestions": "Your technical explanation was good..."
      }
    `;

    return await askAI(prompt, true);
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
  try {
    const prompt = `
      You are an expert technical interviewer evaluating a candidate's verbal answer.
      
      Resume / Profile Context:
      """
      ${contextText}
      """

      Question asked: "${question}"
      Candidate's verbal answer: "${answer}"
      
      Evaluate the answer checking if it logically aligns with their Resume/Profile Context. Provide:
      1. Technical/Relevance Score (1-10)
      2. Clarity Score (1-10)
      3. Improvement Suggestions
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 8,
        "clarityScore": 7,
        "improvementSuggestions": "..."
      }
    `;

    return await askAI(prompt, true);
  } catch (error) {
    console.warn('API Error on Contextual Evaluation. Using fallback.');
    return { technicalScore: 8, clarityScore: 7, improvementSuggestions: "Simulated response: Ensure your answers align directly." };
  }
};

export const evaluateCodeAndExplanation = async (question, code, explanation) => {
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
      
      Evaluate code correctness and whether the explanation logically matches the code.
      Generate 1 follow-up question.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 9,
        "clarityScore": 8,
        "improvementSuggestions": "...",
        "followUpQuestion": "What is the time complexity of your approach?"
      }
    `;

    return await askAI(prompt, true);
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

export const evaluateFollowUpAnswer = async (question, code, followUpQuestion, followUpAnswer) => {
  try {
    const prompt = `
      You are an expert technical interviewer evaluating Round 3 follow-up.
      
      Problem: "${question}"
      Candidate Code:
      \`\`\`
      ${code}
      \`\`\`
      
      Follow-up Question asked: "${followUpQuestion}"
      Candidate's Answer: "${followUpAnswer}"
      
      Evaluate their follow-up answer contextually.
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 9,
        "clarityScore": 8,
        "improvementSuggestions": "..."
      }
    `;

    return await askAI(prompt, true);
  } catch (error) {
    console.warn('API Error on FollowUp Evaluation. Using fallback.');
    return { technicalScore: 10, clarityScore: 10, improvementSuggestions: "Simulated response: Valid follow-up explanation." };
  }
};

export const generateFinalFeedback = async (interviewData) => {
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
      
      Return ONLY a JSON object with this exact structure:
      {
        "strengths": ["...","..."],
        "weaknesses": ["...","..."],
        "improvementSuggestions": "Detailed paragraph on how to improve on their weaknesses...",
        "overallComments": "A brief summary of their overall interview."
      }
    `;

    return await askAI(prompt, true);
  } catch (error) {
    console.warn('API Error on Final Feedback Generation. Using fallback.');
    return {
      strengths: ["General Problem Solving", "Basic Web Development knowledge"],
      weaknesses: ["Advanced DSA concepts", "Communication under pressure"],
      improvementSuggestions: "Focus on practicing optimal approaches and clearly verbalizing logic.",
      overallComments: "Simulated response: A solid performance but needs refinement in advanced optimization."
    };
  }
};

export const evaluateCode = async (question, code, language = 'javascript') => {
  try {
    const prompt = `
      You are an expert technical interviewer evaluating candidate code.
      
      Problem Description: "${question}"
      Candidate's Code (${language}):
      \`\`\`
      ${code}
      \`\`\`
      
      Return ONLY a JSON object with this exact structure:
      {
        "technicalScore": 8,
        "clarityScore": 7, 
        "improvementSuggestions": "Your code is completely correct, but an O(n) approach using a hash map would be more optimal in time complexity."
      }
    `;

    return await askAI(prompt, true);
  } catch (error) {
    console.warn('API Error on Code Evaluation. Using fallback.');
    return { technicalScore: 8, clarityScore: 8, improvementSuggestions: "Simulated response: Code syntax is roughly acceptable." };
  }
};
