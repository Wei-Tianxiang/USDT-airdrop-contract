//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IGTToken {
    function totalSupplyAt(
        uint256 _blockNumber
    ) external view returns (uint256);

    function balanceOfAt(
        address _owner,
        uint256 _blockNumber
    ) external view returns (uint256);
}

interface IERC20TokenBank {
    function issue(address _to, uint256 _amount) external returns (bool);
}

contract USDTAirdrop {
    IGTToken public immutable rds;
    IERC20TokenBank public immutable usdtBank;
    uint public startTime;
    uint public endTime;
    uint public totalAward;
    uint public creationBlock;
    mapping(address => bool) public claimed;

    constructor(
        address _rdsAddr,
        address _usdtBank,
        uint _totalAward,
        uint _startAt,
        uint _endAt
    ) {
        rds = IGTToken(_rdsAddr);
        usdtBank = IERC20TokenBank(_usdtBank);
        totalAward = _totalAward * 10 ** 6;
        startTime = _startAt + block.timestamp;
        endTime = _endAt + block.timestamp;
        creationBlock = block.number;
    }

    event Claim(address indexed addr, uint amount);

    modifier duringAirdrop() {
        require(
            block.timestamp > startTime && block.timestamp < endTime,
            "not started or already ended"
        );
        _;
    }

    function claim() external duringAirdrop {
        uint amount = (rds.balanceOfAt(msg.sender, creationBlock) *
            totalAward) / rds.totalSupplyAt(creationBlock);
        require(amount > 0, "no airdrop");
        require(!claimed[msg.sender], "already claimed");
        claimed[msg.sender] = true;
        bool success = usdtBank.issue(msg.sender, amount);
        require(success);

        emit Claim(msg.sender, amount);
    }
}
