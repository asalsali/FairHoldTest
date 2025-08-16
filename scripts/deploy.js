const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();

  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy FairHold
  const FairHold = await ethers.getContractFactory("FairHold");
  const fairHold = await FairHold.deploy(await mockUSDC.getAddress());
  await fairHold.waitForDeployment();

  console.log("FairHold deployed to:", await fairHold.getAddress());

  // Mint some USDC to deployer for testing
  const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("Minted", ethers.formatUnits(mintAmount, 6), "USDC to deployer");

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("FairHold:", await fairHold.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("Deployer USDC Balance:", ethers.formatUnits(await mockUSDC.balanceOf(deployer.address), 6));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
