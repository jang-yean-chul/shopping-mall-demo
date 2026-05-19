import User from '../models/User.js';

// GET /api/users/profile
export const getProfile = (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/users/profile
export const updateProfile = async (req, res, next) => {
  try {
    // 이메일, 비밀번호, user_type은 이 엔드포인트에서 변경 불가
    const { name, phone, birth_date, gender, profile_image, marketing_agreed } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, birth_date, gender, profile_image, marketing_agreed },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users  (관리자 전용)
export const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(Number(limit), 100);
    const filter = {};
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort('-createdAt')
        .skip((Number(page) - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, total, totalPages: Math.ceil(total / safeLimit), users });
  } catch (err) {
    next(err);
  }
};
