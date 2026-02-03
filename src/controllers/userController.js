const User = require('../models/User');

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        address: user.address,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { name, gender, address } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = String(name).trim();
    if (gender !== undefined && ['Male', 'Female', ''].includes(gender)) user.gender = gender;
    if (address !== undefined) user.address = String(address).trim();
    if (user.name && user.gender) user.isProfileComplete = true;

    await user.save();
    res.json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        address: user.address,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
