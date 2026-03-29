import Interview from '../models/Interview.js';
import User from '../models/User.js';

export const getUserDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      profile: user,
      interviews: interviews
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};
