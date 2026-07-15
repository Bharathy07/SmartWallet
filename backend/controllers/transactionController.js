const axios = require('axios');

const User = require('../models/User');
const Transaction = require('../models/Transaction');

function getLocalHour() {
  // Basic local-hour estimation (server local time). Good enough for this project.
  return new Date().getHours();
}

async function topUpWallet(req, res) {
  try {
    const { amount } = req.body;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance += amt;
    await user.save();

    // Record a transaction so the chart can treat it as “credited”.
    // To avoid showing this as a *debit* in the transaction list (where it compares fromUserId
    // with currentUser), we mark it as incoming: from=current user, to=a special “system” user.
    // ExpenseChart will count it as credited because toUserId matches current user.
    //
    // NOTE: This project’s schema requires valid ObjectId refs.
    const systemUser = await User.findOne({ email: 'system@smartwallet.ai' }) || (await User.create({
      name: 'System',
      email: 'system@smartwallet.ai',
      password: 'system-pass',
      balance: 0,
    }));

    const tx = await Transaction.create({
      fromUserId: systemUser._id,
      toUserId: user._id,
      amount: amt,
      status: 'allowed',
      riskScore: 0,
      aiReason: 'Wallet top-up',
    });

    if (req.app && req.app.emitTransaction) {
      req.app.emitTransaction(user._id, tx);
    }

    return res.json({
      message: 'Top up successful',
      transactionId: tx._id,
      balance: user.balance,
    });
  } catch (err) {
    console.error('[transaction] topUpWallet error:', err);
    console.error('[transaction] topUpWallet error stack:', err?.stack);
    return res.status(500).json({ message: 'Server error', details: err.message || String(err) });
  }
}

async function sendMoney(req, res) {
  try {
    const { fromUserId, toUserId, amount, senderTxCountLast24h, isNewRecipient, toUsername } = req.body;

    const from = await User.findById(fromUserId);
    const to = await User.findById(toUserId);

    if (!from || !to) {
      return res.status(404).json({ message: 'User not found' });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (from.balance < amt) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Call Python AI service BEFORE allowing transaction.
    // IMPORTANT: backend "pauses" here by awaiting the AI response.
    const aiPayload = {
      amount: amt,
      hour: getLocalHour(),
      isNewRecipient: !!isNewRecipient,
      senderTxCountLast24h: Number(senderTxCountLast24h || 0),
    };

    const aiUrl = process.env.AI_SERVICE_URL?.trim() || 'http://127.0.0.1:8001/fraud/check';
    console.log('[transaction] AI URL:', aiUrl);

    // Always allow on AI service failure so users can transact even if python service is down.
    let aiResp;
    try {
      aiResp = await axios.post(aiUrl, aiPayload, { timeout: 8000 });
    } catch (err) {
      // Retry (localhost -> 127.0.0.1) if needed
      if (err?.code === 'ECONNREFUSED' && String(aiUrl).includes('localhost')) {
        const fallbackUrl = aiUrl.replace('localhost', '127.0.0.1');
        console.warn('[transaction] AI localhost refused, retrying with 127.0.0.1:', fallbackUrl);
        try {
          aiResp = await axios.post(fallbackUrl, aiPayload, { timeout: 8000 });
        } catch (err2) {
          console.error('[transaction] AI retry also failed, allowing:', err2?.message || err2);
          aiResp = {
            data: {
              allow: true,
              reason: 'Transaction completed',
              riskScore: 0,
            },
          };
        }
      } else {
        console.error('[transaction] AI service unavailable, allowing:', err?.message || err);
        aiResp = {
          data: {
            allow: true,
            reason: 'AI service unavailable - allowed by fallback',
            riskScore: 0,
          },
        };
      }
    }

    // Safety: if axios returned a non-standard response, fall back to allow
    const aiData = aiResp?.data || {};
    const allow = aiData.allow ?? true;
    const reason = aiData.reason || 'AI service unavailable - allowed by fallback';
    const riskScore = aiData.riskScore ?? 0;



    // --- Demo rule for "unknown/unregistered" usernames ---
    // User wants: only block for these usernames if the typed username is NOT registered.
    // Typed username comes from frontend `toUsername`.
    const specialUsernames = new Set(['Test User A', 'Debug A', 'Debug B', 'User1', 'User2'].map((s) => s.toLowerCase()));
    const typed = String(toUsername || '').trim().toLowerCase();

    // If the typed username matches one of the special usernames,
    // allow only if the resolved recipient user (DB) has that username.
    // Otherwise block with a clear aiReason.
    const isSpecialTyped = specialUsernames.has(typed);
    const dbName = String(to.name || '').trim().toLowerCase();
    const isRegisteredForTyped = isSpecialTyped ? dbName === typed : true;

    const finalAllow = allow && isRegisteredForTyped;
    const finalReason =
      finalAllow
        ? reason
        : 'Unknown/unregistered username (blocked by SmartWallet AI)';

    if (!finalAllow) {
      const tx = await Transaction.create({
        fromUserId: from._id,
        toUserId: to._id,
        amount: amt,
        status: 'blocked',
        riskScore: Number(riskScore),
        aiReason: String(finalReason || reason || 'Blocked by AI'),
      });

      if (req.app && req.app.emitTransaction) {
        req.app.emitTransaction(from._id, tx);
      }

      return res.status(403).json({
        message: 'Blocked by SmartWallet AI',
        ai: { allow, reason, riskScore },
        transactionId: tx._id,
      });
    }

    // Allow: update balances and save transaction
    from.balance -= amt;
    to.balance += amt;

    await from.save();
    await to.save();

    const tx = await Transaction.create({
      fromUserId: from._id,
      toUserId: to._id,
      amount: amt,
      status: 'allowed',
      riskScore: Number(riskScore),
      aiReason: String(reason || 'Allowed by AI'),
    });

    if (req.app && req.app.emitTransaction) {
      req.app.emitTransaction(from._id, tx);
      req.app.emitTransaction(to._id, tx);
    }

    return res.json({
      message: 'Transaction allowed',
      ai: { allow, reason, riskScore },
      transactionId: tx._id,
    });
  } catch (err) {
    console.error('[transaction] sendMoney error:', err);
    console.error('[transaction] sendMoney error stack:', err?.stack);

    if (err.response) {
      return res.status(500).json({
        message: 'AI service error',
        details: err.response.data,
      });
    }

    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'AI service timeout' });
    }

    const details = err.message || JSON.stringify(err, Object.getOwnPropertyNames(err));
    return res.status(500).json({ message: 'Server error', details });
  }
}

module.exports = { sendMoney, topUpWallet };

