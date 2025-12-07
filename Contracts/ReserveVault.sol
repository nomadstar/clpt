// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ReserveVault (ERC-4626)
/// @notice Simple ERC4626 vault for custody of reserves. Governance can publish proofs of reserve.
contract ReserveVault is ERC4626, AccessControl {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    using SafeERC20 for IERC20;

    event ReserveUpdated(string indexed reserveType, uint256 amount, bytes32 proofHash, uint256 timestamp);

    constructor(IERC20Metadata asset, string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC4626(asset) {
        bool _ok;
        _ok = _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _ok = _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    /// @notice Governance can publish an audited proof hash for reserves
    /// @param reserveType e.g. "BANK_ACCOUNT", "GOV_BOND"
    /// @param amount reported amount in asset decimals
    /// @param proofHash hash of off-chain audit/report
    function publishReserveProof(string calldata reserveType, uint256 amount, bytes32 proofHash) external onlyRole(GOVERNANCE_ROLE) {
        emit ReserveUpdated(reserveType, amount, proofHash, block.timestamp);
    }

    /// @notice Emergency withdraw of underlying assets to governance (only governance)
    function emergencyWithdraw(address to, uint256 amount) external onlyRole(GOVERNANCE_ROLE) {
        require(to != address(0), "invalid to");
        IERC20(address(asset())).safeTransfer(to, amount);
    }
}
