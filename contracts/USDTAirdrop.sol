//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IGTToken {
    function totalSupplyAt(uint256 _blockNumber)
        external
        view
        returns (uint256);

    function balanceOfAt(address _owner, uint256 _blockNumber)
        external
        view
        returns (uint256);
}

interface IERC20TokenBank {
    function issue(address _to, uint256 _amount) external returns (bool);
}

contract USDTAirdrop is Ownable {
    IGTToken public immutable rds;
    IERC20TokenBank public immutable usdtBank;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalAward;
    uint256 public creationBlock;
    mapping(address => bool) public claimed;

    constructor(
        address _rdsAddr,
        address _usdtBank,
        uint256 _totalAward,
        uint256 _startAt,
        uint256 _endAt
    ) {
        rds = IGTToken(_rdsAddr);
        usdtBank = IERC20TokenBank(_usdtBank);
        totalAward = _totalAward * 10**6;
        startTime = _startAt + block.timestamp;
        endTime = _endAt + block.timestamp;
        creationBlock = block.number;
    }

    event Claim(address indexed addr, uint256 amount);

    modifier duringAirdrop() {
        require(
            block.timestamp > startTime && block.timestamp < endTime,
            "not started or already ended"
        );
        _;
    }

    function claim() external duringAirdrop {
        uint256 amount = (rds.balanceOfAt(msg.sender, creationBlock) *
            totalAward) / rds.totalSupplyAt(creationBlock);
        require(amount > 0, "no airdrop");
        require(!claimed[msg.sender], "already claimed");
        claimed[msg.sender] = true;
        bool success = usdtBank.issue(msg.sender, amount);
        require(success);

        emit Claim(msg.sender, amount);
    }

    function changeTotalAward(uint256 _totalAward) external onlyOwner {
        totalAward = _totalAward;
    }
}
