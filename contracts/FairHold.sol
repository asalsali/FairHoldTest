// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FairHold is ReentrancyGuard, Ownable {
    IERC20 public immutable paymentToken;
    
    // Events
    event AgreementCreated(uint256 id, address vendor, address payer, uint256 total);
    event Funded(uint256 id, uint256 amount);
    event Released(uint256 id, uint256 milestoneId, uint256 amount);
    event ChangeRequested(uint256 id, uint256 changeId);
    event ChangeApproved(uint256 id, uint256 changeId);
    event Canceled(uint256 id, uint8 reason, uint256 refund);
    event Disputed(uint256 id);
    event Resolved(uint256 id, uint256 vendorPayout, uint256 payerRefund);
    event AutoRefundTriggered(uint256 id, uint256 amount);

    // Structs
    struct Milestone {
        string name;
        uint256 percentage;
        uint256 deadline;
        bool released;
    }

    struct ChangeRequest {
        uint256 newTotal;
        string description;
        bool approved;
        bool executed;
    }

    struct Agreement {
        address vendor;
        address payer;
        uint256 total;
        uint256 funded;
        uint256 released;
        uint256 eventDate;
        uint256 createdAt;
        bool canceled;
        bool disputed;
        uint8 cancelReason;
        uint256 autoRefundDays;
        uint256 coolingOffHours;
        bool vendorFaultAlwaysRefund;
        uint256 deadlineGraceHours;
        Milestone[] milestones;
        ChangeRequest[] changes;
    }

    // State variables
    uint256 public nextAgreementId = 1;
    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => mapping(uint256 => bool)) public milestoneReleased;

    // Preset configurations
    enum PresetType { WEDDING, RENTAL }

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    function createAgreement(
        address _vendor,
        address _payer,
        uint256 _total,
        uint256 _eventDate,
        PresetType _preset,
        address _mediator
    ) external returns (uint256) {
        require(_vendor != address(0), "Invalid vendor");
        require(_payer != address(0), "Invalid payer");
        require(_total > 0, "Total must be positive");
        require(_eventDate > block.timestamp, "Event date must be in future");

        uint256 agreementId = nextAgreementId++;
        Agreement storage agreement = agreements[agreementId];
        
        agreement.vendor = _vendor;
        agreement.payer = _payer;
        agreement.total = _total;
        agreement.eventDate = _eventDate;
        agreement.createdAt = block.timestamp;

        // Apply preset configuration
        if (_preset == PresetType.WEDDING) {
            _applyWeddingPreset(agreement);
        } else if (_preset == PresetType.RENTAL) {
            _applyRentalPreset(agreement);
        }

        emit AgreementCreated(agreementId, _vendor, _payer, _total);
        return agreementId;
    }

    function fund(uint256 _agreementId, uint256 _amount) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Agreement is canceled");
        require(msg.sender == agreement.payer, "Only payer can fund");
        require(_amount > 0, "Amount must be positive");
        require(agreement.funded + _amount <= agreement.total, "Cannot exceed total");

        agreement.funded += _amount;
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        emit Funded(_agreementId, _amount);
    }

    function releaseMilestone(uint256 _agreementId, uint256 _milestoneId) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Agreement is canceled");
        require(!agreement.disputed, "Agreement is disputed");
        require(msg.sender == agreement.payer, "Only payer can release");
        require(_milestoneId < agreement.milestones.length, "Invalid milestone");
        
        Milestone storage milestone = agreement.milestones[_milestoneId];
        require(!milestone.released, "Milestone already released");
        require(block.timestamp >= milestone.deadline - agreement.deadlineGraceHours * 1 hours, "Too early to release");

        uint256 amount = (agreement.total * milestone.percentage) / 100;
        require(agreement.funded >= agreement.released + amount, "Insufficient funds");

        milestone.released = true;
        agreement.released += amount;
        milestoneReleased[_agreementId][_milestoneId] = true;

        require(paymentToken.transfer(agreement.vendor, amount), "Transfer failed");
        emit Released(_agreementId, _milestoneId, amount);
    }

    function requestChange(uint256 _agreementId, uint256 _newTotal, string calldata _description) external {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Agreement is canceled");
        require(msg.sender == agreement.vendor, "Only vendor can request changes");

        uint256 changeId = agreement.changes.length;
        agreement.changes.push(ChangeRequest({
            newTotal: _newTotal,
            description: _description,
            approved: false,
            executed: false
        }));

        emit ChangeRequested(_agreementId, changeId);
    }

    function approveChange(uint256 _agreementId, uint256 _changeId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Agreement is canceled");
        require(msg.sender == agreement.payer, "Only payer can approve changes");
        require(_changeId < agreement.changes.length, "Invalid change request");
        
        ChangeRequest storage change = agreement.changes[_changeId];
        require(!change.approved, "Change already approved");
        require(!change.executed, "Change already executed");

        change.approved = true;
        change.executed = true;
        agreement.total = change.newTotal;

        emit ChangeApproved(_agreementId, _changeId);
    }

    function cancel(uint256 _agreementId, uint8 _reason) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Already canceled");
        require(msg.sender == agreement.payer || msg.sender == agreement.vendor, "Unauthorized");
        require(_reason <= 2, "Invalid reason"); // 0: cooling off, 1: policy, 2: vendor fault

        agreement.canceled = true;
        agreement.cancelReason = _reason;

        uint256 refundAmount = _calculateRefund(agreement, _reason);
        uint256 vendorPayout = agreement.released;
        uint256 remainingFunds = agreement.funded - agreement.released - refundAmount;

        // Refund to payer
        if (refundAmount > 0) {
            require(paymentToken.transfer(agreement.payer, refundAmount), "Refund transfer failed");
        }

        // Pay vendor for completed work
        if (vendorPayout > 0) {
            require(paymentToken.transfer(agreement.vendor, vendorPayout), "Vendor transfer failed");
        }

        // Return remaining funds to payer
        if (remainingFunds > 0) {
            require(paymentToken.transfer(agreement.payer, remainingFunds), "Remaining funds transfer failed");
        }

        emit Canceled(_agreementId, _reason, refundAmount);
    }

    function dispute(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Agreement is canceled");
        require(!agreement.disputed, "Already disputed");
        require(msg.sender == agreement.payer || msg.sender == agreement.vendor, "Unauthorized");

        agreement.disputed = true;
        emit Disputed(_agreementId);
    }

    function resolve(uint256 _agreementId, uint256 _vendorPayout, uint256 _payerRefund) external onlyOwner nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.disputed, "Not disputed");
        require(_vendorPayout + _payerRefund <= agreement.funded, "Invalid payout amounts");

        agreement.disputed = false;
        agreement.canceled = true;

        if (_vendorPayout > 0) {
            require(paymentToken.transfer(agreement.vendor, _vendorPayout), "Vendor transfer failed");
        }

        if (_payerRefund > 0) {
            require(paymentToken.transfer(agreement.payer, _payerRefund), "Payer transfer failed");
        }

        emit Resolved(_agreementId, _vendorPayout, _payerRefund);
    }

    function triggerAutoRefund(uint256 _agreementId) external onlyOwner nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(!agreement.canceled, "Agreement is canceled");
        require(agreement.autoRefundDays > 0, "No auto refund configured");
        require(block.timestamp >= agreement.eventDate + agreement.autoRefundDays * 1 days, "Too early for auto refund");

        uint256 refundAmount = agreement.funded - agreement.released;
        require(refundAmount > 0, "No funds to refund");

        agreement.canceled = true;
        require(paymentToken.transfer(agreement.payer, refundAmount), "Refund transfer failed");

        emit AutoRefundTriggered(_agreementId, refundAmount);
    }

    // View functions
    function getAgreement(uint256 _agreementId) external view returns (
        address vendor,
        address payer,
        uint256 total,
        uint256 funded,
        uint256 released,
        uint256 eventDate,
        uint256 createdAt,
        bool canceled,
        bool disputed,
        uint8 cancelReason
    ) {
        Agreement storage agreement = agreements[_agreementId];
        return (
            agreement.vendor,
            agreement.payer,
            agreement.total,
            agreement.funded,
            agreement.released,
            agreement.eventDate,
            agreement.createdAt,
            agreement.canceled,
            agreement.disputed,
            agreement.cancelReason
        );
    }

    function getMilestones(uint256 _agreementId) external view returns (Milestone[] memory) {
        return agreements[_agreementId].milestones;
    }

    function getChanges(uint256 _agreementId) external view returns (ChangeRequest[] memory) {
        return agreements[_agreementId].changes;
    }

    // Internal functions
    function _applyWeddingPreset(Agreement storage agreement) internal {
        // Milestones
        agreement.milestones.push(Milestone({
            name: "Deposit",
            percentage: 40,
            deadline: agreement.createdAt + 24 hours,
            released: false
        }));
        
        agreement.milestones.push(Milestone({
            name: "Samples Approved",
            percentage: 20,
            deadline: agreement.eventDate - 30 days,
            released: false
        }));
        
        agreement.milestones.push(Milestone({
            name: "Event Day Completion",
            percentage: 40,
            deadline: agreement.eventDate,
            released: false
        }));

        // Configuration
        agreement.coolingOffHours = 24;
        agreement.vendorFaultAlwaysRefund = true;
        agreement.deadlineGraceHours = 24;
    }

    function _applyRentalPreset(Agreement storage agreement) internal {
        // Milestones
        agreement.milestones.push(Milestone({
            name: "Security Deposit Funded",
            percentage: 100,
            deadline: agreement.createdAt + 24 hours,
            released: false
        }));
        
        agreement.milestones.push(Milestone({
            name: "Move-in Condition Submitted",
            percentage: 0,
            deadline: agreement.eventDate + 72 hours, // eventDate = move-in date
            released: false
        }));
        
        agreement.milestones.push(Milestone({
            name: "Move-out Inspection",
            percentage: 0,
            deadline: agreement.eventDate + 7 days, // assuming 7-day rental
            released: false
        }));
        
        agreement.milestones.push(Milestone({
            name: "Refund Deadline",
            percentage: 0,
            deadline: agreement.eventDate + 14 days,
            released: false
        }));

        // Configuration
        agreement.autoRefundDays = 14;
        agreement.deadlineGraceHours = 24;
        agreement.vendorFaultAlwaysRefund = true;
    }

    function _calculateRefund(Agreement storage agreement, uint8 reason) internal view returns (uint256) {
        if (reason == 0) { // Cooling off
            return agreement.funded - agreement.released;
        } else if (reason == 2) { // Vendor fault
            return agreement.funded - agreement.released;
        } else { // Policy-based (reason == 1)
            uint256 daysUntilEvent = (agreement.eventDate - block.timestamp) / 1 days;
            uint256 unreleasedFunds = agreement.funded - agreement.released;
            
            if (daysUntilEvent >= 30) {
                return unreleasedFunds;
            } else if (daysUntilEvent >= 8) {
                return unreleasedFunds / 2;
            } else {
                return 0;
            }
        }
    }
}
