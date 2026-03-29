import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect('mongodb://localhost:27017/ai-interview-platform', { autoIndex: true })
  .then(async () => {
    const users = await User.find({}).select('+password');
    console.log(users.map(u => ({ email: u.email, hasPassword: !!u.password, pwdPrefix: u.password ? u.password.substring(0, 7) : null })));
    mongoose.disconnect();
  })
  .catch(console.error);
