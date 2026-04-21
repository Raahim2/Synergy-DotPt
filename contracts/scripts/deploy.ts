import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const Marketplace = await ethers.getContractFactory("DeAIMarketplace");
  
  // Notice the empty () because our new contract doesn't require a constructor argument!
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  const contractAddress = await marketplace.getAddress();
  
  console.log(`\n✅ DeAIMarketplace deployed successfully!`);
  console.log(`🔗 Contract Address: ${contractAddress}`);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exitCode = 1;
});