const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const mockUSDCAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const fairHoldAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Attach to deployed contracts
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = MockUSDC.attach(mockUSDCAddress);

  const FairHold = await ethers.getContractFactory("FairHold");
  const fairHold = FairHold.attach(fairHoldAddress);

  // Create random addresses for vendor and payer
  const vendor = ethers.Wallet.createRandom();
  const payer = ethers.Wallet.createRandom();

  console.log("=== FairHold Demo ===");
  console.log("Vendor:", vendor.address);
  console.log("Payer:", payer.address);

  // Mint USDC to payer
  const mintAmount = ethers.parseUnits("1500", 6);
  await mockUSDC.mint(payer.address, mintAmount);
  console.log("✅ Minted", ethers.formatUnits(mintAmount, 6), "USDC to payer");

  // 1. Create agreement
  const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600; // 60 days from now
  const total = ethers.parseUnits("1500", 6);

  console.log("\n1. Creating Wedding agreement...");
  const createTx = await fairHold.createAgreement(
    vendor.address,
    payer.address,
    total,
    eventDate,
    0, // WEDDING preset
    ethers.ZeroAddress
  );

  const createReceipt = await createTx.wait();
  console.log("✅ Agreement created! Hash:", createReceipt.hash);

  // Get agreement ID
  const createEvent = createReceipt.logs.find(log => {
    try {
      const parsed = fairHold.interface.parseLog(log);
      return parsed.name === "AgreementCreated";
    } catch {
      return false;
    }
  });

  let agreementId;
  if (createEvent) {
    const parsed = fairHold.interface.parseLog(createEvent);
    agreementId = parsed.args[0];
    console.log("📋 Agreement ID:", agreementId.toString());
  }

  // 2. Fund agreement
  console.log("\n2. Funding agreement...");
  await mockUSDC.connect(payer).approve(fairHoldAddress, total);
  const fundTx = await fairHold.connect(payer).fund(agreementId, total);
  const fundReceipt = await fundTx.wait();
  console.log("✅ Agreement funded! Hash:", fundReceipt.hash);

  // Check balances
  const payerBalance = await mockUSDC.balanceOf(payer.address);
  const contractBalance = await mockUSDC.balanceOf(fairHoldAddress);
  console.log("💰 Payer balance:", ethers.formatUnits(payerBalance, 6), "USDC");
  console.log("🏦 Contract balance:", ethers.formatUnits(contractBalance, 6), "USDC");

  // 3. Release first milestone
  console.log("\n3. Releasing first milestone...");
  const releaseTx = await fairHold.connect(payer).releaseMilestone(agreementId, 0);
  const releaseReceipt = await releaseTx.wait();
  console.log("✅ Milestone released! Hash:", releaseReceipt.hash);

  // Check final balances
  const finalPayerBalance = await mockUSDC.balanceOf(payer.address);
  const finalContractBalance = await mockUSDC.balanceOf(fairHoldAddress);
  const vendorBalance = await mockUSDC.balanceOf(vendor.address);
  
  console.log("\n=== Final Balances ===");
  console.log("💰 Payer:", ethers.formatUnits(finalPayerBalance, 6), "USDC");
  console.log("🏦 Contract:", ethers.formatUnits(finalContractBalance, 6), "USDC");
  console.log("👨‍💼 Vendor:", ethers.formatUnits(vendorBalance, 6), "USDC");

  console.log("\n🎉 Demo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
