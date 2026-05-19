import Address from '../models/Address.js';
import User from '../models/User.js';

// GET /api/addresses
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort('-createdAt').lean();
    res.json({ success: true, addresses });
  } catch (err) {
    next(err);
  }
};

// POST /api/addresses
export const createAddress = async (req, res, next) => {
  try {
    const address = await Address.create({ ...req.body, user: req.user._id });

    // 첫 배송지 추가 시 자동으로 기본 배송지로 지정
    if (!req.user.default_address) {
      await User.findByIdAndUpdate(req.user._id, { default_address: address._id });
    }

    res.status(201).json({ success: true, address });
  } catch (err) {
    next(err);
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!address) {
      return res.status(404).json({ success: false, message: '배송지를 찾을 수 없습니다.' });
    }
    res.json({ success: true, address });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: '배송지를 찾을 수 없습니다.' });
    }

    // 삭제된 배송지가 기본 배송지였으면 다른 배송지로 자동 교체
    if (req.user.default_address?.toString() === req.params.id) {
      const next_ = await Address.findOne({ user: req.user._id }).sort('-createdAt');
      await User.findByIdAndUpdate(req.user._id, { default_address: next_?._id ?? null });
    }

    res.json({ success: true, message: '배송지가 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: '배송지를 찾을 수 없습니다.' });
    }

    await User.findByIdAndUpdate(req.user._id, { default_address: address._id });
    res.json({ success: true, message: '기본 배송지가 변경되었습니다.' });
  } catch (err) {
    next(err);
  }
};
