// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/operatorforwarder/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 */

/**
 * THIS IS AN EXAMPLE CONTRACT WHICH USES HARDCODED VALUES FOR CLARITY.
 * THIS EXAMPLE USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

contract CLPPriceFeed is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;
    using SafeERC20 for IERC20;

    uint256 public clpPrice;
    bytes32 private jobId;
    uint256 private fee;

    event RequestVolume(bytes32 indexed requestId, uint256 volume);

    /**
     * @notice Initialize the link token and target oracle
     *
     * Sepolia Testnet details:
     * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
     * jobId: ca98366cc7314957b8c012c72f05aeeb
     *
     */
    constructor() ConfirmedOwner(msg.sender) {
    _setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
    _setChainlinkOracle(0xCC79157eb46F5624204f47AB42b3906cAA40eaB7);
        jobId = "ca98366cc7314957b8c012c72f05aeeb";
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job)
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */
    function requestCLPPriceFromUSDC() public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillCLP.selector
        );

        // Set the URL to perform the GET request on
        req._add(
            "get",
            "https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=CLP"
        );
        req._add("path", "CLP"); // Chainlink nodes 1.0.0 and later support this format

        // Multiply the result by 1000000000000000000 to remove decimals
    int256 timesAmount = 10 ** 6;
    req._addInt("times", timesAmount);

        // Sends the request
    return _sendChainlinkRequest(req, fee);
    }

    function requestAll() public {
        bytes32 reqId = requestCLPPriceFromUSDC();
        // Emit usage of the event to avoid 'unused-event' diagnostics
        emit RequestVolume(reqId, 0);
    }

    function fulfillCLP(bytes32 _requestId, uint256 _price)
        public
        recordChainlinkFulfillment(_requestId)
    {
        clpPrice = _price;
    }

    /**
     * Allow withdraw of Link tokens from the contract
     */
    function withdrawLink() public onlyOwner {
        IERC20 link = IERC20(_chainlinkTokenAddress());
        // Use SafeERC20 to handle tokens that don't return booleans
        link.safeTransfer(msg.sender, link.balanceOf(address(this)));
    }
}
