import api from "../utils/axios";

/**
 * Fetch available billing / coin plans
 */
export const getPlans = async () => {
  try {
    const response = await api.get("/api/billing/plans");
    return response.data;
  } catch (error) {
    console.error("getPlans error:", error);
    return {
      success: false,
      plans: [],
      message: error.response?.data?.message || error.message || "Failed to fetch plans",
    };
  }
};

/**
 * Create a Razorpay payment order for a chosen plan
 * @param {string} planId - "starter" | "pro" | "enterprise"
 */
export const createBillingOrder = async (planId) => {
  try {
    const response = await api.post("/api/billing/create", { planId });
    return response.data;
  } catch (error) {
    console.error("createBillingOrder error:", error);
    return (
      error.response?.data || {
        success: false,
        message: error.message || "Failed to create order",
      }
    );
  }
};

/**
 * Verify Razorpay payment signature
 * @param {object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
 */
export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post("/api/billing/verify", paymentData);
    return response.data;
  } catch (error) {
    console.error("verifyPayment error:", error);
    return (
      error.response?.data || {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to verify payment",
      }
    );
  }
};

/**
 * Fetch user's billing and transaction history
 */
export const getBillingHistory = async () => {
  try {
    const response = await api.get("/api/billing/history");
    return response.data;
  } catch (error) {
    console.error("getBillingHistory error:", error);
    return {
      success: false,
      history: [],
      message: error.response?.data?.message || error.message || "Failed to fetch billing history",
    };
  }
};
