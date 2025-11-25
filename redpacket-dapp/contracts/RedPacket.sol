// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title RedPacket - 一个可收回剩余金额的发红包合约
 * @dev 支持发红包、抢红包、未抢完可收回
 */
contract RedPacket {
    using Address for address payable;

    // 红包结构体
    struct Packet {
        address payable sender; // 发红包的人
        uint256 totalAmount; // 总金额（wei）
        uint256 totalParticipants; // 总抢红包人数（限制）
        uint256 claimedCount; // 已抢人数
        uint256 endTime; // 截止时间（0表示无限期）
        bool isRecoverable; // 是否可收回
        mapping(address => bool) hasClaimed; // 记录该红包已抢用户
    }

    // 抢红包记录
    struct ClaimRecord {
        address claimer;
        uint256 amount;
        uint256 timestamp;
    }

    // 所有红包
    mapping(uint256 => Packet) public packets;
    // 每个红包的抢红包记录
    mapping(uint256 => ClaimRecord[]) public claimRecords;

    // 红包数量计数器
    uint256 public packetCounter = 0;

    // 事件
    event RedPacketCreated(
        uint256 indexed id,
        address indexed sender,
        uint256 totalAmount,
        uint256 totalParticipants,
        uint256 endTime
    );

    event RedPacketClaimed(
        uint256 indexed id,
        address indexed claimer,
        uint256 amount,
        uint256 timestamp
    );

    event RedPacketRecovered(
        uint256 indexed id,
        address indexed sender,
        uint256 remainingAmount,
        uint256 timestamp
    );

    //=======================
    // 发红包功能
    //=======================
    function createRedPacket(
        uint256 totalParticipants,
        uint256 endTime // 0 表示不过期
    ) external payable {
        require(msg.value > 0, "Amount must be > 0");
        require(totalParticipants > 0, "Must have at least 1 participant");

        uint256 id = packetCounter++;

        Packet storage packet = packets[id];

        packet.sender = payable(msg.sender);
        packet.totalAmount = msg.value;
        packet.totalParticipants = totalParticipants;
        packet.claimedCount = 0;
        packet.endTime = endTime;
        packet.isRecoverable = true;

        emit RedPacketCreated(
            id,
            msg.sender,
            msg.value,
            totalParticipants,
            endTime
        );
    }

    //=======================
    // 抢红包功能
    //=======================
    function claimRedPacket(uint256 id) external {
        Packet storage packet = packets[id];
        require(packet.sender != address(0), "Invalid packet ID");
        require(
            packet.isRecoverable,
            "This packet has been reclaimed or expired"
        );
        require(
            packet.claimedCount < packet.totalParticipants,
            "All slots are filled"
        );
        require(
            block.timestamp <= packet.endTime || packet.endTime == 0,
            "Red packet expired"
        );
        require(
            !packet.hasClaimed[msg.sender],
            "You have already claimed this red packet"
        );

        // 计算抢到的金额（可简单平均，也可以随机）
        uint256 amount = (packet.totalAmount / packet.totalParticipants); // 简单平均（可优化为随机）

        // 确保不会因为整除导致金额损失
        if (packet.claimedCount == packet.totalParticipants - 1) {
            amount =
                packet.totalAmount -
                (packet.claimedCount *
                    (packet.totalAmount / packet.totalParticipants));
        }

        // 发送金额
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send ether");

        // 更新记录
        packet.claimedCount++;
        packet.hasClaimed[msg.sender] = true;
        claimRecords[id].push(
            ClaimRecord({
                claimer: msg.sender,
                amount: amount,
                timestamp: block.timestamp
            })
        );

        emit RedPacketClaimed(id, msg.sender, amount, block.timestamp);

        // 如果已经抢完，关闭收回功能
        if (packet.claimedCount == packet.totalParticipants) {
            packet.isRecoverable = false;
        }
    }

    //=======================
    // 发红包者收回剩余金额
    //=======================
    function recoverRemaining(uint256 id) external {
        Packet storage packet = packets[id];
        require(
            packet.sender == payable(msg.sender),
            "Only the sender can recover"
        );
        require(
            packet.isRecoverable,
            "Cannot recover: already claimed or expired"
        );
        require(
            packet.claimedCount < packet.totalParticipants,
            "No remaining amount to recover"
        );
        uint256 actualRemaining = (packet.totalAmount -
            (packet.claimedCount *
                (packet.totalAmount / packet.totalParticipants)));

        // 安全转账
        (bool sent, ) = payable(msg.sender).call{value: actualRemaining}("");
        require(sent, "Failed to send recovered ether");

        // 标记为不可收回
        packet.isRecoverable = false;

        emit RedPacketRecovered(
            id,
            msg.sender,
            actualRemaining,
            block.timestamp
        );
    }

    //=======================
    // 查看红包信息
    //=======================
    function getPacketInfo(
        uint256 id
    )
        external
        view
        returns (
            address sender,
            uint256 totalAmount,
            uint256 totalParticipants,
            uint256 claimedCount,
            bool isRecoverable,
            uint256 endTime
        )
    {
        Packet storage p = packets[id];
        return (
            p.sender,
            p.totalAmount,
            p.totalParticipants,
            p.claimedCount,
            p.isRecoverable,
            p.endTime
        );
    }

    // 查询指定用户是否已领取某个红包
    function hasUserClaimed(
        uint256 id,
        address user
    ) external view returns (bool) {
        require(packets[id].sender != address(0), "Invalid packet ID");
        return packets[id].hasClaimed[user];
    }
    function getClaimRecords(
        uint256 id
    ) external view returns (ClaimRecord[] memory) {
        return claimRecords[id];
    }
}