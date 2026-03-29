# AI Resume Based Interview Platform

A full-stack AI-powered application that analyzes a candidate's resume, extracts relevant skills and GitHub repositories, and conducts a customized technical interview. The platform uses Google's Gemini AI to generate tailored questions and automatically evaluates the candidate's answers.

## Features

- 📄 **Smart Resume Parsing**: Extracts skills and GitHub URLs from PDF resumes.
- 🐙 **GitHub Integration**: Analyzes public repositories to ask context-aware questions.
- 🤖 **AI-Generated Questions**: Gemini 2.5 Flash crafts 5 technical questions based on the exact skills and repos found.
- 📝 **Interactive Interview**: Clean, modern interface to submit answers.
- 📊 **Performance Dashboard**: Immediate feedback with Chart.js visualizations (Radar and Bar charts) showing Technical and Clarity scores.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, Chart.js, Axios, Lucide React
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Multer, pdf-parse
- **AI Integration**: `@google/genai` (Gemini API)

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas URI
- A Google Gemini API Key
- A GitHub Personal Access Token (optional, prevents rate limits)

### 1. Clone & Install Dependencies

```bash
# Clone the repository (or copy the files)
cd ai-interview-platform

# Install Backend Dependencies
cd server
npm i

# Install Frontend Dependencies
cd ../client
npm i
```

### 2. Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-interview-platform
# Get your key from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
# Optional: Get a token from GitHub Developer Settings
GITHUB_TOKEN=your_github_token_here
```

### 3. Run the Application

You'll need two terminals to run the frontend and backend servers simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```
*(Server runs on http://localhost:5000)*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*(Frontend runs on http://localhost:5173)*

## Usage Guide

1. Navigate to `http://localhost:5173`
2. Click **Get Started** and upload your PDF Resume.
3. Review the extracted skills and GitHub integrations on the **Analysis Page**.
4. Click **Start Interview** to begin. The AI will generate 5 customized questions.
5. Answer the questions consecutively.
6. Once finished, you will be redirected to the **Dashboard** to see your Technical and Clarity scores and receive specific improvement advice from the AI.

## Project Structure Highlights

- `server/services/gemini.service.js`: Contains all the specialized AI prompts used for extracting info, generating questions, and evaluating responses.
- `server/controllers/`: Contains logic for resuming parsing, interview state management, and dashboard data aggregation.
- `client/src/pages/`: Contains all main React views (Landing, Upload, Analysis, Interview, Dashboard). 
