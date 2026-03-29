import User from '../models/User.js';
import { extractTextFromPDF } from '../services/pdf.service.js';
import { extractProfileFromResume } from '../services/gemini.service.js';
import fs from 'fs';

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text from the uploaded PDF
    const resumeText = await extractTextFromPDF(req.file.path);
    
    if (!resumeText || resumeText.trim().length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'No readable text found. Please ensure your PDF is text-based (not a scanned image) so the AI can read it.'
      });
    }
    
    // Analyze with AI to extract details
    const extractedData = await extractProfileFromResume(resumeText);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Update the existing logged in user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only update name if it wasn't set, but always update skills and github info
    user.githubUsername = extractedData.githubUsername || user.githubUsername;
    user.githubProfileUrl = extractedData.githubProfileUrl || user.githubProfileUrl;
    user.linkedinProfileUrl = extractedData.linkedinProfileUrl || user.linkedinProfileUrl;
    user.skills = extractedData.skills || user.skills;
    user.experience = extractedData.experience || user.experience || [];
    user.education = extractedData.education || user.education || [];
    user.projects = extractedData.projects || user.projects || [];
    user.resumeText = resumeText;
    
    if (req.body.leetcodeUsername) {
        user.leetcodeUsername = req.body.leetcodeUsername;
    }

    await user.save();

    res.status(200).json({
      message: 'Resume processed successfully',
      user
    });
  } catch (error) {
    console.error('Error handling uploaded resume:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
};
