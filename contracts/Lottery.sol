// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
        manager = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function enter() external payable {
        require(msg.value > 0.01 ether);

        players.push(msg.sender);
    }

    function pickWinner() external restricted {
        uint index = random() % players.length;
        address payable winner = payable(players[index]);
        winner.transfer(address(this).balance);

        players = new address[](0);
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }
}