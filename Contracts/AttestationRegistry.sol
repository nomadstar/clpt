// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AttestationRegistry
/// @notice Simple registry to publish Merkle roots (attestations) on-chain.
/// Only accounts with GOVERNANCE_ROLE can register roots. Emits event with publisher and block info.
contract AttestationRegistry is AccessControl {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    event RootRegistered(bytes32 indexed root, address indexed who, uint256 blockNumber, uint256 timestamp);

    // registered roots
    mapping(bytes32 => bool) public isRegistered;

    constructor() {
        bool _ok;
        _ok = _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _ok = _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    /// @notice Register a merkle root as an attestation on-chain
    /// @param root merkle root to register
    function registerRoot(bytes32 root) external onlyRole(GOVERNANCE_ROLE) {
        require(root != bytes32(0), "invalid root");
        require(!isRegistered[root], "already registered");
        isRegistered[root] = true;
        emit RootRegistered(root, msg.sender, block.number, block.timestamp);
    }

    /// @notice Check whether a root was previously registered
    /// @param root merkle root
    /// @return true if registered
    function verifyRoot(bytes32 root) external view returns (bool) {
        return isRegistered[root];
    }
}
