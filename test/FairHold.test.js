const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FairHold", function () {
  let mockUSDC;
  let fairHold;
  let owner;
  let vendor;
  let payer;
  let mediator;

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

    it("Should create wedding agreement", async function () {
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0, // WEDDING preset
        mediator.address
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const agreement = await fairHold.getAgreement(1);
      expect(agreement.vendor).to.equal(vendor.address);
      expect(agreement.payer).to.equal(payer.address);
      expect(agreement.total).to.equal(total);
    });

    it("Should create rental agreement", async function () {
      const tx = await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        1, // RENTAL preset
        mediator.address
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const agreement = await fairHold.getAgreement(1);
      expect(agreement.vendor).to.equal(vendor.address);
      expect(agreement.payer).to.equal(payer.address);
      expect(agreement.total).to.equal(total);
    });
  });

  describe("Funding and Release", function () {
    const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
    const total = ethers.parseUnits("1500", 6);

    it("Should fund and release milestone", async function () {
      // Create agreement
      await fairHold.createAgreement(
        vendor.address,
        payer.address,
        total,
        eventDate,
        0, // WEDDING preset
        mediator.address
      );

      // Fund agreement
      await mockUSDC.connect(payer).approve(await fairHold.getAddress(), total);
      await fairHold.connect(payer).fund(1, total);

      // Check funding
      const agreement = await fairHold.getAgreement(1);
      expect(agreement.funded).to.equal(total);

      // Release first milestone
      await fairHold.connect(payer).releaseMilestone(1, 0);

      // Check release
      const milestones = await fairHold.getMilestones(1);
      expect(milestones[0].released).to.be.true;
    });
  });
});
