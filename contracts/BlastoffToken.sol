// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BlastoffToken
 * @notice Minimal ERC20 implementation used by BlastoffTokenFactory.
 *         The factory is the only address allowed to mint and burn.
 */
contract BlastoffToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public immutable factory;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, address factory_) {
        require(factory_ != address(0), "factory required");
        name = name_;
        symbol = symbol_;
        factory = factory_;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "only factory");
        _;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "transfer to zero");
        uint256 fromBal = balanceOf[from];
        require(fromBal >= value, "insufficient balance");
        unchecked {
            balanceOf[from] = fromBal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _mint(address to, uint256 value) internal {
        require(to != address(0), "mint to zero");
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        uint256 fromBal = balanceOf[from];
        require(fromBal >= value, "burn exceeds balance");
        unchecked {
            balanceOf[from] = fromBal - value;
            totalSupply -= value;
        }
        emit Transfer(from, address(0), value);
    }

    /// @notice Mint tokens. Only callable by factory.
    function mint(address to, uint256 value) external onlyFactory {
        _mint(to, value);
    }

    /// @notice Burn tokens from an address. Only callable by factory.
    function burn(address from, uint256 value) external onlyFactory {
        _burn(from, value);
    }
}

