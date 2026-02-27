// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BlastoffToken.sol";

/**
 * @title BlastoffTokenFactory
 * @notice Minimal bonding-curve TokenFactory for Blastoff.
 *
 * Exposes an interface compatible with the existing frontend:
 *  - createToken(string,string) -> address
 *  - buy(address,uint256) payable
 *  - sell(address,uint256)
 *  - withdraw(address,address)
 *  - tokens(address) -> uint8 (0 NOT_CREATED, 1 ICO, 2 GRADUATED)
 *  - collateral(address) -> uint256
 *  - balances(address,address) -> uint256 (for completeness)
 *  - calculateRequiredBaseCoinExp(address,uint256) -> uint256 (ETH required)
 *  - CONSTANT getters: DECIMALS, MAX_SUPPLY, INITIAL_MINT, FUNDING_GOAL, INITIAL_PRICE, K
 *  - event TokenMinted(address tokenAddress, address creator)
 *
 * NOTE: This is a deliberately simplified design intended for experimentation.
 *       It uses a basic linear bonding curve rather than the full Clanker v4 math.
 */
contract BlastoffTokenFactory {
    /// @dev 18-decimal fixed point (1e18).
    uint256 public constant DECIMALS = 1e18;

    /// @dev Max theoretical supply per token (for UI only).
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * DECIMALS; // 1B

    /// @dev Initial mint held by the factory for ICO sales.
    uint256 public constant INITIAL_MINT = 200_000_000 * DECIMALS; // 200M

    /// @dev Target funding goal used for UI display (30 ETH).
    uint256 public constant FUNDING_GOAL = 30 ether;

    /// @dev Starting price on the curve (in ETH per token, 18 decimals).
    uint256 public constant INITIAL_PRICE = 1e14; // 0.0001 ETH

    /// @dev Linear slope of the bonding curve. Tunable parameter.
    uint256 public constant K = 5e13; // 0.00005 ETH per 1e18 tokens sold

    /// @dev Token state: 0 = NOT_CREATED, 1 = ICO, 2 = GRADUATED.
    enum TokenState {
        NOT_CREATED,
        ICO,
        GRADUATED
    }

    struct TokenInfo {
        TokenState state;
        uint256 collateral; // Total ETH raised via curve
        uint256 sold;       // Tokens sold via curve (18 decimals)
    }

    address public immutable owner;

    /// @dev token => info
    mapping(address => TokenInfo) public tokenInfo;

    /// @dev token => user => token balance held by factory on behalf of user (unused but kept for ABI compatibility).
    ///      Public visibility automatically creates a getter:
    ///      balances(address token, address user) -> uint256
    mapping(address => mapping(address => uint256)) public balances;

    event TokenMinted(address indexed tokenAddress, address indexed creator);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ------------------------------------------------------------------------
    // View helpers (ABI compatibility)
    // ------------------------------------------------------------------------

    function tokens(address token) external view returns (uint8) {
        return uint8(tokenInfo[token].state);
    }

    function collateral(address token) external view returns (uint256) {
        return tokenInfo[token].collateral;
    }

    // ------------------------------------------------------------------------
    // Bonding curve helpers (simple linear curve)
    // ------------------------------------------------------------------------

    function _priceAt(uint256 sold) internal pure returns (uint256) {
        // price(sold) = INITIAL_PRICE + K * sold / 1e18
        return INITIAL_PRICE + (K * sold) / DECIMALS;
    }

    /**
     * @notice Calculate ETH required to buy `amount` tokens from the current state.
     * @dev This integrates a linear curve by approximating using the average
     *      price between startSold and endSold.
     */
    function calculateRequiredBaseCoinExp(address tokenAddress, uint256 amount) public view returns (uint256) {
        TokenInfo memory info = tokenInfo[tokenAddress];
        require(info.state == TokenState.ICO, "not ICO");
        require(amount > 0, "amount=0");

        uint256 startSold = info.sold;
        uint256 endSold = startSold + amount;

        uint256 priceStart = _priceAt(startSold);
        uint256 priceEnd = _priceAt(endSold);
        uint256 avgPrice = (priceStart + priceEnd) / 2;

        // requiredEth = amount * avgPrice / 1e18
        return (amount * avgPrice) / DECIMALS;
    }

    // ------------------------------------------------------------------------
    // Core functions
    // ------------------------------------------------------------------------

    /**
     * @notice Deploy a new Blastoff token and initialize ICO state.
     * @param name Token name
     * @param ticker Token symbol
     */
    function createToken(string calldata name, string calldata ticker) external returns (address) {
        BlastoffToken token = new BlastoffToken(name, ticker, address(this));

        // Mint initial supply to the factory for ICO sales.
        token.mint(address(this), INITIAL_MINT);

        TokenInfo storage info = tokenInfo[address(token)];
        require(info.state == TokenState.NOT_CREATED, "already created");
        info.state = TokenState.ICO;
        info.collateral = 0;
        info.sold = 0;

        emit TokenMinted(address(token), msg.sender);
        return address(token);
    }

    /**
     * @notice Buy tokens from the bonding curve.
     * @param tokenAddress Token to buy
     * @param amount Amount of tokens (18 decimals) the user wants to receive
     */
    function buy(address tokenAddress, uint256 amount) external payable {
        TokenInfo storage info = tokenInfo[tokenAddress];
        require(info.state == TokenState.ICO, "not ICO");
        require(amount > 0, "amount=0");

        uint256 requiredEth = calculateRequiredBaseCoinExp(tokenAddress, amount);
        require(msg.value >= requiredEth, "insufficient ETH");

        // Update state
        info.collateral += requiredEth;
        info.sold += amount;

        // Transfer tokens from factory inventory to buyer
        BlastoffToken token = BlastoffToken(tokenAddress);
        token.transfer(msg.sender, amount);

        // Track factory-held balance (optional; mostly for ABI compatibility / debugging)
        balances[tokenAddress][msg.sender] += amount;

        // Refund any excess ETH
        if (msg.value > requiredEth) {
            payable(msg.sender).transfer(msg.value - requiredEth);
        }
    }

    /**
     * @notice Sell tokens back into the bonding curve for ETH.
     * @param tokenAddress Token being sold
     * @param amount Amount of tokens (18 decimals) the user wants to sell
     */
    function sell(address tokenAddress, uint256 amount) external {
        TokenInfo storage info = tokenInfo[tokenAddress];
        require(info.state == TokenState.ICO, "not ICO");
        require(amount > 0, "amount=0");
        require(amount <= info.sold, "sell>sold");

        // Approximate ETH out using the same linear curve (reverse direction).
        uint256 endSold = info.sold;
        uint256 startSold = endSold - amount;

        uint256 priceStart = _priceAt(startSold);
        uint256 priceEnd = _priceAt(endSold);
        uint256 avgPrice = (priceStart + priceEnd) / 2;
        uint256 ethOut = (amount * avgPrice) / DECIMALS;

        require(ethOut <= info.collateral, "insufficient collateral");

        // Pull tokens from user and burn them
        BlastoffToken token = BlastoffToken(tokenAddress);
        // User must have approved the factory as spender.
        require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        token.burn(address(this), amount);

        // Update state
        info.collateral -= ethOut;
        info.sold -= amount;

        // Decrement tracked balance
        uint256 prevBal = balances[tokenAddress][msg.sender];
        if (prevBal >= amount) {
            balances[tokenAddress][msg.sender] = prevBal - amount;
        } else {
            balances[tokenAddress][msg.sender] = 0;
        }

        // Pay ETH to seller
        payable(msg.sender).transfer(ethOut);
    }

    /**
     * @notice Withdraw remaining ETH collateral for a token (e.g. after graduation).
     *         Only callable by owner.
     */
    function withdraw(address tokenAddress, address to) external onlyOwner {
        require(to != address(0), "to=0");
        uint256 amount = tokenInfo[tokenAddress].collateral;
        tokenInfo[tokenAddress].collateral = 0;
        if (amount > 0) {
            payable(to).transfer(amount);
        }
    }
}

