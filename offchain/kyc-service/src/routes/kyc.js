const express = require('express');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak');
const { ethers } = require('ethers');

const router = express.Router();

// Simple in-memory store (replace with DB)
const kycStore = new Map();
let lastMerkleRoot = null;

// POST /api/kyc/verify
// body: { userId: "user-123", wallet: "0x...", status: "approved" }
router.post('/kyc/verify', (req, res) => {
  const { userId, wallet, status } = req.body;
  if (!userId || !wallet || !status) return res.status(400).json({ error: 'missing fields' });

  kycStore.set(wallet.toLowerCase(), { userId, status, updatedAt: new Date().toISOString() });
  return res.json({ ok: true, wallet: wallet.toLowerCase() });
});

// POST /api/kyc/merkle/generate
// body: { wallets: ["0x...", ...] } -> returns merkle root
router.post('/kyc/merkle/generate', (req, res) => {
  const wallets = req.body.wallets;
  if (!Array.isArray(wallets) || wallets.length === 0) return res.status(400).json({ error: 'no wallets' });

  const leaves = wallets.map(w => keccak256(w.toLowerCase()));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getRoot().toString('hex');
  lastMerkleRoot = `0x${root}`;
  // In production: persist the tree and root, sign and/or publish on-chain
  return res.json({ merkleRoot: lastMerkleRoot });
});

// GET /api/kyc/merkle/latest
router.get('/kyc/merkle/latest', (req, res) => {
  return res.json({ merkleRoot: lastMerkleRoot });
});

// GET /api/kyc/status/:wallet
router.get('/kyc/status/:wallet', (req, res) => {
  const w = req.params.wallet.toLowerCase();
  const rec = kycStore.get(w);
  if (!rec) return res.status(404).json({ error: 'not found' });
  return res.json(rec);
});

// --- Attestation endpoints ---
// POST /api/attestation/prepare
// body: { merkleRoot: "0x...", contractAddress?: "0x..." }
// returns unsigned transaction data to call registerRoot(bytes32)
router.post('/attestation/prepare', (req, res) => {
  const { merkleRoot, contractAddress } = req.body;
  const root = merkleRoot;
  if (!root) return res.status(400).json({ error: 'missing merkleRoot' });

  const tgt = contractAddress || process.env.ATTESTATION_CONTRACT_ADDRESS;
  if (!tgt) return res.status(400).json({ error: 'missing contractAddress and no env configured' });

  // minimal ABI for AttestationRegistry.registerRoot(bytes32)
  const abi = [
    'function registerRoot(bytes32 root)'
  ];
  try {
    const iface = new ethers.Interface(abi);
    // ensure root is 0x-prefixed and 32 bytes
    const rootBytes = ethers.getBytes(root);
    if (rootBytes.length !== 32) return res.status(400).json({ error: 'merkleRoot must be 32 bytes' });

    const data = iface.encodeFunctionData('registerRoot', [root]);
    // return transaction skeleton for multisig to sign and send
    return res.json({ to: tgt, data, value: '0x0' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'encoding failed', detail: err.toString() });
  }
});

  // POST /api/kyc/claveunica/prepare
  // body: { wallet: "0x..", verified: true, contractAddress?: "0x..." }
  // returns tx skeleton to call setClaveUnicaVerified(address,bool)
  router.post('/kyc/claveunica/prepare', (req, res) => {
    const { wallet, verified, contractAddress } = req.body;
    if (!wallet || typeof verified === 'undefined') return res.status(400).json({ error: 'missing fields' });
    const tgt = contractAddress || process.env.CONTRACT_ADDRESS;
    if (!tgt) return res.status(400).json({ error: 'missing contractAddress and no env configured' });

    const abi = [
      'function setClaveUnicaVerified(address who, bool verified)'
    ];
    try {
      const iface = new ethers.Interface(abi);
      const data = iface.encodeFunctionData('setClaveUnicaVerified', [wallet, !!verified]);
      return res.json({ to: tgt, data, value: '0x0' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'encoding failed', detail: err.toString() });
    }
  });

  // POST /api/kyc/claveunica/prepareBatch
  // body: { wallets: ["0x..."], verified: [true,false], contractAddress?: "0x..." }
  router.post('/kyc/claveunica/prepareBatch', (req, res) => {
    const { wallets, verified, contractAddress } = req.body;
    if (!Array.isArray(wallets) || !Array.isArray(verified)) return res.status(400).json({ error: 'missing/invalid arrays' });
    const tgt = contractAddress || process.env.CONTRACT_ADDRESS;
    if (!tgt) return res.status(400).json({ error: 'missing contractAddress and no env configured' });

    const abi = [
      'function setClaveUnicaVerifiedBatch(address[] who, bool[] verified)'
    ];
    try {
      const iface = new ethers.Interface(abi);
      const data = iface.encodeFunctionData('setClaveUnicaVerifiedBatch', [wallets, verified]);
      return res.json({ to: tgt, data, value: '0x0' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'encoding failed', detail: err.toString() });
    }
  });

  // POST /api/kyc/individual/prepare
  // body: { wallet: "0x..", isIndividual: true, contractAddress?: "0x..." }
  router.post('/kyc/individual/prepare', (req, res) => {
    const { wallet, isIndividual, contractAddress } = req.body;
    if (!wallet || typeof isIndividual === 'undefined') return res.status(400).json({ error: 'missing fields' });
    const tgt = contractAddress || process.env.CONTRACT_ADDRESS;
    if (!tgt) return res.status(400).json({ error: 'missing contractAddress and no env configured' });

    const abi = [
      'function setIsIndividual(address who, bool individual)'
    ];
    try {
      const iface = new ethers.Interface(abi);
      const data = iface.encodeFunctionData('setIsIndividual', [wallet, !!isIndividual]);
      return res.json({ to: tgt, data, value: '0x0' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'encoding failed', detail: err.toString() });
    }
  });

  // POST /api/kyc/individual/prepareBatch
  // body: { wallets: ["0x..."], individuals: [true,false], contractAddress?: "0x..." }
  router.post('/kyc/individual/prepareBatch', (req, res) => {
    const { wallets, individuals, contractAddress } = req.body;
    if (!Array.isArray(wallets) || !Array.isArray(individuals)) return res.status(400).json({ error: 'missing/invalid arrays' });
    const tgt = contractAddress || process.env.CONTRACT_ADDRESS;
    if (!tgt) return res.status(400).json({ error: 'missing contractAddress and no env configured' });

    const abi = [
      'function setIsIndividualBatch(address[] who, bool[] individuals)'
    ];
    try {
      const iface = new ethers.Interface(abi);
      const data = iface.encodeFunctionData('setIsIndividualBatch', [wallets, individuals]);
      return res.json({ to: tgt, data, value: '0x0' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'encoding failed', detail: err.toString() });
    }
  });

module.exports = router;
