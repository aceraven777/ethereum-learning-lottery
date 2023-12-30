// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
        manager = msg.sender;
    }

    function enter() external payable {
        require(msg.value > 0.01 ether);

        players.push(msg.sender);
    }
}