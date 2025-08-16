import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Running demo with account:", deployer.address);

  // Get deployed contracts
  const mockUSDCAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const fairHoldAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = MockUSDC.attach(mockUSDCAddress);

  const FairHold = await ethers.getContractFactory("FairHold");
  const fairHold = FairHold.attach(fairHoldAddress);

  // Create test accounts
  const vendor = ethers.Wallet.createRandom();
  const payer = ethers.Wallet.createRandom();

  console.log("Test accounts:");
  console.log("Vendor:", vendor.address);
  console.log("Payer:", payer.address);

  // Mint USDC to payer
  const amount = ethers.parseUnits("1500", 6);
  await mockUSDC.mint(payer.address, amount);
  console.log("Minted", ethers.formatUnits(amount, 6), "USDC to payer");

  // Create wedding agreement
  const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600;
  const total = ethers.parseUnits("1500", 6);

  console.log("\n1. Creating wedding agreement...");
  const createTx = await fairHold.createAgreement(
    vendor.address,
    payer.address,
    total,
    eventDate,
    0, // WEDDING preset
    ethers.ZeroAddress
  );

  const createReceipt = await createTx.wait();
  const createEvent = createReceipt?.logs.find(log => {
    try {
      const parsed = fairHold.interface.parseLog(log as any);
      return parsed?.name === "AgreementCreated";
    } catch {
      return false;
    }
  });

  let agreementId;
  if (createEvent) {
    const parsed = fairHold.interface.parseLog(createEvent as any);
    agreementId = parsed?.args[0];
    console.log("Agreement created with ID:", agreementId.toString());
  }

  // Fund the agreement
  console.log("\n2. Funding agreement...");
  await mockUSDC.connect(payer).approve(fairHoldAddress, total);
  const fundTx = await fairHold.connect(payer).fund(agreementId, total);
  const fundReceipt = await fundTx.wait();
  console.log("Fund transaction hash:", fundTx.hash);

  // Get agreement details
  const agreement = await fairHold.getAgreement(agreementId);
  console.log("\n3. Agreement details:");
  console.log("Total:", ethers.formatUnits(agreement.total, 6), "USDC");
  console.log("Funded:", ethers.formatUnits(agreement.funded, 6), "USDC");
  console.log("Released:", ethers.formatUnits(agreement.released, 6), "USDC");

  // Get milestones
  const milestones = await fairHold.getMilestones(agreementId);
  console.log("\n4. Milestones:");
  milestones.forEach((milestone, index) => {
    console.log(`${index}: ${milestone.name} - ${milestone.percentage}% - ${new Date(Number(milestone.deadline) * 1000).toLocaleDateString()}`);
  });

  // Release first milestone (Deposit - 40%)
  console.log("\n5. Releasing first milestone (Deposit)...");
  const releaseTx = await fairHold.connect(payer).releaseMilestone(agreementId, 0);
  await releaseTx.wait();
  console.log("Release transaction hash:", releaseTx.hash);

  // Check updated balances
  const vendorBalance = await mockUSDC.balanceOf(vendor.address);
  const payerBalance = await mockUSDC.balanceOf(payer.address);
  console.log("\n6. Updated balances:");
  console.log("Vendor balance:", ethers.formatUnits(vendorBalance, 6), "USDC");
  console.log("Payer balance:", ethers.formatUnits(payerBalance, 6), "USDC");

  console.log("\nDemo completed successfully!");
  console.log("===================");
  console.log("Agreement ID:", agreementId.toString());
  console.log("Fund transaction:", fundTx.hash);
  console.log("Release transaction:", releaseTx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
