import { v4 as uuid } from "uuid";
import User from "../models/userSchema.js";

const PLANS = {
  monthly: { label: "Monthly Pro", amount: 499, durationDays: 30 },
  annual: { label: "Annual Pro", amount: 3999, durationDays: 365 },
};

// POST /api/subscription/subscribe
export const subscribe = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.userId;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: "Invalid plan. Choose 'monthly' or 'annual'." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if already has an active subscription
    const now = new Date();
    if (user.isPro && user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
      return res.status(409).json({
        error: "You already have an active subscription.",
        expiresAt: user.subscriptionExpiresAt,
      });
    }

    const selectedPlan = PLANS[plan];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + selectedPlan.durationDays);

    const txnId = `C2P-${uuid().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    await User.findByIdAndUpdate(userId, {
      isPro: true,
      plan,
      subscriptionExpiresAt: expiresAt,
      $push: {
        paymentHistory: {
          plan,
          amount: selectedPlan.amount,
          currency: "INR",
          txnId,
          paidAt: new Date(),
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Subscription to ${selectedPlan.label} activated!`,
      txnId,
      plan,
      amount: selectedPlan.amount,
      subscriptionExpiresAt: expiresAt,
    });
  } catch (err) {
    console.error("subscribe error:", err);
    return res.status(500).json({ error: err.message || "Subscription failed" });
  }
};

// GET /api/subscription/status
export const getStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "isPro plan subscriptionExpiresAt paymentHistory"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Auto-expire: if past expiry, reset isPro
    const now = new Date();
    if (user.isPro && user.subscriptionExpiresAt && user.subscriptionExpiresAt < now) {
      await User.findByIdAndUpdate(userId, { isPro: false, plan: "free" });
      return res.json({ isPro: false, plan: "free", subscriptionExpiresAt: null, paymentHistory: user.paymentHistory });
    }

    return res.json({
      isPro: user.isPro,
      plan: user.plan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      paymentHistory: user.paymentHistory,
    });
  } catch (err) {
    console.error("getStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
};
