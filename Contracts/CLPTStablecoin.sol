// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// Minimal local Pausable implementation to avoid external import resolution issues.
/// Matches the subset of OpenZeppelin Pausable used in this contract:
/// - paused()
/// - _pause()
/// - _unpause()
abstract contract Pausable {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    function _pause() internal virtual {
        require(!_paused, "Pausable: paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    function _unpause() internal virtual {
        require(_paused, "Pausable: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }
}

contract CLPTStablecoin is ERC20, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    address public admin;
    IERC20 public collateralToken;
    AggregatorV3Interface public priceFeed;

    uint public constant COLLATERAL_DECIMAL = 1e6;

    // permissioning
    mapping(address => bool) private _whitelist;

    event Whitelisted(address indexed who);
    event Dewhitelisted(address indexed who);

    constructor(
        address _collateralToken,
        address _pricefeed
    ) ERC20("Chilean Pesos Token", "CLPT") {
        require(
            _collateralToken != address(0),
            "Invalid collateral token address"
        );
        require(_pricefeed != address(0), "Invalid price feed address");

        admin = msg.sender;
        collateralToken = IERC20(_collateralToken);
        priceFeed = AggregatorV3Interface(_pricefeed);

    // setup roles (grant initial roles to admin)
    bool _ok;
    _ok = _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _ok = _grantRole(GOVERNANCE_ROLE, admin);
    _ok = _grantRole(MINTER_ROLE, admin);
    _ok = _grantRole(BURNER_ROLE, admin);
    _ok = _grantRole(PAUSER_ROLE, admin);
    _ok = _grantRole(KYC_ADMIN_ROLE, admin);
    _ok = _grantRole(AUDITOR_ROLE, admin);
        // by default whitelist admin
        _whitelist[admin] = true;
        emit Whitelisted(admin);
    }

    function getCollateralPrice() public view returns (uint) {
        (, int price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        return uint(price);
    }

    function calculateCollateralAmount(
        uint _stablecoinAmount
    ) public view returns (uint) {
        uint collateralprice = getCollateralPrice();
        // SafeMath is not required in Solidity ^0.8.x (built-in overflow checks)
        return (_stablecoinAmount * COLLATERAL_DECIMAL) / collateralprice;
    }

    function mint(uint _stablecoinAmount) external {
        require(_stablecoinAmount > 0, "Invalid stablecoin amount");

        require(isWhitelisted(msg.sender), "sender not whitelisted");

        uint collateralAmount = calculateCollateralAmount(_stablecoinAmount);
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);

        _mint(msg.sender, _stablecoinAmount);
    }

    function burn(uint _stablecoinAmount) external {
        require(_stablecoinAmount > 0, "Invalid stablecoin amount");

        require(isWhitelisted(msg.sender), "sender not whitelisted");

        uint collateralAmount = calculateCollateralAmount(_stablecoinAmount);
        _burn(msg.sender, _stablecoinAmount);
        collateralToken.safeTransfer(msg.sender, collateralAmount);
    }

    // Whitelist management
    function addToWhitelist(address who) external onlyRole(KYC_ADMIN_ROLE) {
        _whitelist[who] = true;
        emit Whitelisted(who);
    }

    function removeFromWhitelist(address who) external onlyRole(KYC_ADMIN_ROLE) {
        _whitelist[who] = false;
        emit Dewhitelisted(who);
    }

    function isWhitelisted(address who) public view returns (bool) {
        return _whitelist[who];
    }

    // Pausable
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Snapshot for auditors / reporting
    // Snapshot for auditors / reporting
    function snapshot() external view onlyRole(AUDITOR_ROLE) returns (uint256) {
        revert("Snapshot not supported in this build");
    }
    // Override ERC20._update to enforce whitelist and pausability in OpenZeppelin v5
    function _update(address from, address to, uint256 value) internal override {
        require(!paused(), "token transfer while paused");

        // allow minting (from == 0) only if recipient whitelisted
        if (from == address(0)) {
            require(isWhitelisted(to), "recipient not whitelisted");
        } else if (to == address(0)) {
            // burning
            require(isWhitelisted(from), "sender not whitelisted");
        } else {
            // regular transfers require both parties whitelisted
            require(isWhitelisted(from) && isWhitelisted(to), "both parties must be whitelisted");
        }

        super._update(from, to, value);
    }

    // AccessControl support
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return AccessControl.supportsInterface(interfaceId);
    }
}