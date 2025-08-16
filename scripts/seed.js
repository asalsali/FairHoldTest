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

  console.log("Creating sample Wedding agreement...");
  console.log("Vendor:", vendor.address);
  console.log("Payer:", payer.address);

  // Mint USDC to payer
  const mintAmount = ethers.parseUnits("1500", 6);
  await mockUSDC.mint(payer.address, mintAmount);
  console.log("Minted", ethers.formatUnits(mintAmount, 6), "USDC to payer");

  // Create agreement
  const eventDate = Math.floor(Date.now() / 1000) + 60 * 24 * 3600; // 60 days from now
  const total = ethers.parseUnits("1500", 6);

  const tx = await fairHold.createAgreement(
    vendor.address,
    payer.address,
    total,
    eventDate,
    0, // WEDDING preset
    ethers.ZeroAddress // no mediator
  );

  const receipt = await tx.wait();
  console.log("Agreement created! Transaction hash:", receipt.hash);

  // Get agreement ID from event
  const event = receipt.logs.find(log => {
    try {
      const parsed = fairHold.interface.parseLog(log);
      return parsed.name === "AgreementCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = fairHold.interface.parseLog(event);
    const agreementId = parsed.args[0];
    console.log("Agreement ID:", agreementId.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
