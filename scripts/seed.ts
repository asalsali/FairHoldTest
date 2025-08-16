import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Seeding with account:", deployer.address);

  // Get deployed contracts
  const mockUSDCAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default local deployment
  const fairHoldAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Default local deployment

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = MockUSDC.attach(mockUSDCAddress);

  const FairHold = await ethers.getContractFactory("FairHold");
  const fairHold = FairHold.attach(fairHoldAddress);

  // Create test accounts
  const vendor = ethers.Wallet.createRandom();
  const payer = ethers.Wallet.createRandom();

  console.log("Test accounts created:");
  console.log("Vendor:", vendor.address);
  console.log("Payer:", payer.address);

  // Mint USDC to payer
  const amount = ethers.parseUnits("1500", 6); // 1,500 USDC
  await mockUSDC.mint(payer.address, amount);
  console.log("Minted", ethers.formatUnits(amount, 6), "USDC to payer");

  // Create wedding agreement
  const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600; // 60 days from now
  const total = ethers.parseUnits("1500", 6); // 1,500 USDC

  console.log("\nCreating wedding agreement...");
  console.log("Event date:", new Date(eventDate * 1000).toLocaleDateString());
  console.log("Total amount:", ethers.formatUnits(total, 6), "USDC");

  const tx = await fairHold.createAgreement(
    vendor.address,
    payer.address,
    total,
    eventDate,
    0, // WEDDING preset
    ethers.ZeroAddress // No mediator
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
    console.log("Agreement created with ID:", agreementId.toString());
    console.log("Agreement ID:", agreementId.toString());
  }

  console.log("\nSeed completed successfully!");
  console.log("===================");
  console.log("Vendor:", vendor.address);
  console.log("Payer:", payer.address);
  console.log("Payer USDC Balance:", ethers.formatUnits(await mockUSDC.balanceOf(payer.address), 6));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
