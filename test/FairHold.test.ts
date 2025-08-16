import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC, FairHold } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FairHold", function () {
  let mockUSDC: MockUSDC;
  let fairHold: FairHold;
  let owner: SignerWithAddress;
  let vendor: SignerWithAddress;
  let payer: SignerWithAddress;
  let mediator: SignerWithAddress;

  beforeEach(async function () {
    [owner, vendor, payer, mediator] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();

    // Deploy FairHold
    const FairHold = await ethers.getContractFactory("FairHold");
    fairHold = await FairHold.deploy(await mockUSDC.getAddress());

    // Mint USDC to payer
    await mockUSDC.mint(payer.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct payment token", async function () {
      expect(await fairHold.paymentToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await fairHold.owner()).to.equal(owner.address);
    });
  });

  describe("Agreement Creation", function () {
    const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600; // 60 days from now
    const total = ethers.parseUnits("1500", 6);

    it("Should create wedding agreement with correct preset", async function () {
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0, // WEDDING preset
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        const agreementId = parsed?.args[0];
        
        const agreement = await fairHold.getAgreement(agreementId);
        expect(agreement.vendor).to.equal(vendor.address);
        expect(agreement.payer).to.equal(payer.address);
        expect(agreement.total).to.equal(total);
        expect(agreement.eventDate).to.equal(eventDate);

        const milestones = await fairHold.getMilestones(agreementId);
        expect(milestones.length).to.equal(3);
        expect(milestones[0].name).to.equal("Deposit");
        expect(milestones[0].percentage).to.equal(40);
        expect(milestones[1].name).to.equal("Samples Approved");
        expect(milestones[1].percentage).to.equal(20);
        expect(milestones[2].name).to.equal("Event Day Completion");
        expect(milestones[2].percentage).to.equal(40);
      }
    });

    it("Should create rental agreement with correct preset", async function () {
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        1, // RENTAL preset
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        const agreementId = parsed?.args[0];
        
        const milestones = await fairHold.getMilestones(agreementId);
        expect(milestones.length).to.equal(4);
        expect(milestones[0].name).to.equal("Security Deposit Funded");
        expect(milestones[0].percentage).to.equal(100);
        expect(milestones[1].name).to.equal("Move-in Condition Submitted");
        expect(milestones[1].percentage).to.equal(0);
      }
    });

    it("Should fail with invalid parameters", async function () {
      await expect(
        fairHold.createAgreement(
          ethers.ZeroAddress,
          payer.address,
          total,
          eventDate,
          0,
          mediator.address
        )
      ).to.be.revertedWith("Invalid vendor");

      await expect(
        fairHold.createAgreement(
          vendor.address,
          ethers.ZeroAddress,
          total,
          eventDate,
          0,
          mediator.address
        )
      ).to.be.revertedWith("Invalid payer");

      await expect(
        fairHold.createAgreement(
          vendor.address,
          payer.address,
          0,
          eventDate,
          0,
          mediator.address
        )
      ).to.be.revertedWith("Total must be positive");

      const pastDate = Math.floor(Date.now() / 1000) - 24 * 3600;
      await expect(
        fairHold.createAgreement(
          vendor.address,
          payer.address,
          total,
          pastDate,
          0,
          mediator.address
        )
      ).to.be.revertedWith("Event date must be in future");
    });
  });

  describe("Funding", function () {
    let agreementId: bigint;
    const total = ethers.parseUnits("1500", 6);

    beforeEach(async function () {
      const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        agreementId = parsed?.args[0];
      }
    });

    it("Should fund agreement successfully", async function () {
      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), total);
      
      const tx = await fairHold.connect(payer).fund(agreementId, total);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "Funded";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const agreement = await fairHold.getAgreement(agreementId);
      expect(agreement.funded).to.equal(total);
    });

    it("Should fail if not payer", async function () {
      await mockUSDC.connect(vendor).approve(await fairHold.getAddress(), total);
      
      await expect(
        fairHold.connect(vendor).fund(agreementId, total)
      ).to.be.revertedWith("Only payer can fund");
    });

    it("Should fail if amount exceeds total", async function () {
      const excessAmount = ethers.parseUnits("2000", 6);
      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), excessAmount);
      
      await expect(
        fairHold.connect(payer).fund(agreementId, excessAmount)
      ).to.be.revertedWith("Cannot exceed total");
    });
  });

  describe("Milestone Release", function () {
    let agreementId: bigint;
    const total = ethers.parseUnits("1500", 6);

    beforeEach(async function () {
      const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        agreementId = parsed?.args[0];
      }

      // Fund the agreement
      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), total);
      await fairHold.connect(payer).fund(agreementId, total);
    });

    it("Should release milestone successfully", async function () {
      const vendorBalanceBefore = await mockUSDC.balanceOf(vendor.address);
      
      const tx = await fairHold.connect(payer).releaseMilestone(agreementId, 0);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "Released";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const vendorBalanceAfter = await mockUSDC.balanceOf(vendor.address);
      const expectedAmount = (total * 40n) / 100n; // 40% of total
      expect(vendorBalanceAfter - vendorBalanceBefore).to.equal(expectedAmount);

      const agreement = await fairHold.getAgreement(agreementId);
      expect(agreement.released).to.equal(expectedAmount);
    });

    it("Should fail if not payer", async function () {
      await expect(
        fairHold.connect(vendor).releaseMilestone(agreementId, 0)
      ).to.be.revertedWith("Only payer can release");
    });

    it("Should fail if milestone already released", async function () {
      await fairHold.connect(payer).releaseMilestone(agreementId, 0);
      
      await expect(
        fairHold.connect(payer).releaseMilestone(agreementId, 0)
      ).to.be.revertedWith("Milestone already released");
    });
  });

  describe("Cancellation", function () {
    let agreementId: bigint;
    const total = ethers.parseUnits("1500", 6);

    beforeEach(async function () {
      const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        agreementId = parsed?.args[0];
      }

      // Fund the agreement
      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), total);
      await fairHold.connect(payer).fund(agreementId, total);
    });

    it("Should cancel with cooling off (100% refund)", async function () {
      const payerBalanceBefore = await mockUSDC.balanceOf(payer.address);
      
      const tx = await fairHold.connect(payer).cancel(agreementId, 0); // Cooling off
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "Canceled";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const payerBalanceAfter = await mockUSDC.balanceOf(payer.address);
      expect(payerBalanceAfter - payerBalanceBefore).to.equal(total);

      const agreement = await fairHold.getAgreement(agreementId);
      expect(agreement.canceled).to.be.true;
      expect(agreement.cancelReason).to.equal(0);
    });

    it("Should cancel with vendor fault (100% refund)", async function () {
      const payerBalanceBefore = await mockUSDC.balanceOf(payer.address);
      
      await fairHold.connect(payer).cancel(agreementId, 2); // Vendor fault
      
      const payerBalanceAfter = await mockUSDC.balanceOf(payer.address);
      expect(payerBalanceAfter - payerBalanceBefore).to.equal(total);
    });

    it("Should enforce policy-based refund windows", async function () {
      // Create agreement with event date 30+ days away
      const farEventDate = Math.floor(Date.now() / 1000) + 35 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        farEventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      let newAgreementId;
      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        newAgreementId = parsed?.args[0];
      }

      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), total);
      await fairHold.connect(payer).fund(newAgreementId, total);

      const payerBalanceBefore = await mockUSDC.balanceOf(payer.address);
      
      await fairHold.connect(payer).cancel(newAgreementId, 1); // Policy-based
      
      const payerBalanceAfter = await mockUSDC.balanceOf(payer.address);
      expect(payerBalanceAfter - payerBalanceBefore).to.equal(total); // 100% refund for ≥30d
    });
  });

  describe("Change Requests", function () {
    let agreementId: bigint;
    const total = ethers.parseUnits("1500", 6);

    beforeEach(async function () {
      const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        agreementId = parsed?.args[0];
      }
    });

    it("Should request and approve change", async function () {
      const newTotal = ethers.parseUnits("1800", 6);
      
      // Request change
      const requestTx = await fairHold.connect(vendor).requestChange(
        agreementId,
        newTotal,
        "Additional flowers requested"
      );
      
      const requestReceipt = await requestTx.wait();
      const requestEvent = requestReceipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "ChangeRequested";
        } catch {
          return false;
        }
      });

      expect(requestEvent).to.not.be.undefined;

      // Approve change
      const approveTx = await fairHold.connect(payer).approveChange(agreementId, 0);
      const approveReceipt = await approveTx.wait();
      
      const approveEvent = approveReceipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "ChangeApproved";
        } catch {
          return false;
        }
      });

      expect(approveEvent).to.not.be.undefined;

      const agreement = await fairHold.getAgreement(agreementId);
      expect(agreement.total).to.equal(newTotal);
    });

    it("Should fail if non-vendor requests change", async function () {
      const newTotal = ethers.parseUnits("1800", 6);
      
      await expect(
        fairHold.connect(payer).requestChange(
          agreementId,
          newTotal,
          "Additional flowers requested"
        )
      ).to.be.revertedWith("Only vendor can request changes");
    });

    it("Should fail if non-payer approves change", async function () {
      const newTotal = ethers.parseUnits("1800", 6);
      
      await fairHold.connect(vendor).requestChange(
        agreementId,
        newTotal,
        "Additional flowers requested"
      );

      await expect(
        fairHold.connect(vendor).approveChange(agreementId, 0)
      ).to.be.revertedWith("Only payer can approve changes");
    });
  });

  describe("Disputes", function () {
    let agreementId: bigint;
    const total = ethers.parseUnits("1500", 6);

    beforeEach(async function () {
      const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        agreementId = parsed?.args[0];
      }
    });

    it("Should create dispute", async function () {
      const tx = await fairHold.connect(payer).dispute(agreementId);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "Disputed";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const agreement = await fairHold.getAgreement(agreementId);
      expect(agreement.disputed).to.be.true;
    });

    it("Should resolve dispute", async function () {
      await fairHold.connect(payer).dispute(agreementId);

      const vendorPayout = ethers.parseUnits("500", 6);
      const payerRefund = ethers.parseUnits("1000", 6);

      const tx = await fairHold.connect(owner).resolve(agreementId, vendorPayout, payerRefund);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "Resolved";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const agreement = await fairHold.getAgreement(agreementId);
      expect(agreement.disputed).to.be.false;
      expect(agreement.canceled).to.be.true;
    });

    it("Should fail if non-owner resolves", async function () {
      await fairHold.connect(payer).dispute(agreementId);

      await expect(
        fairHold.connect(payer).resolve(agreementId, 0, 0)
      ).to.be.revertedWithCustomError(fairHold, "OwnableUnauthorizedAccount");
    });
  });

  describe("Invariants", function () {
    let agreementId: bigint;
    const total = ethers.parseUnits("1500", 6);

    beforeEach(async function () {
      const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0,
        mediator.address
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = fairHold.interface.parseLog(log as any);
          return parsed?.name === "AgreementCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = fairHold.interface.parseLog(event as any);
        agreementId = parsed?.args[0];
      }
    });

    it("Should maintain sum of milestone percentages equals 100", async function () {
      const milestones = await fairHold.getMilestones(agreementId);
      let totalPercentage = 0;
      
      for (const milestone of milestones) {
        totalPercentage += Number(milestone.percentage);
      }
      
      expect(totalPercentage).to.equal(100);
    });

    it("Should not allow over-release", async function () {
      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), total);
      await fairHold.connect(payer).fund(agreementId, total);

      // Release first milestone (40%)
      await fairHold.connect(payer).releaseMilestone(agreementId, 0);

      // Try to release more than funded
      await expect(
        fairHold.connect(payer).releaseMilestone(agreementId, 1)
      ).to.be.revertedWith("Insufficient funds");
    });
  });
});
