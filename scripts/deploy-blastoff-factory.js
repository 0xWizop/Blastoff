const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Blastoff contracts with account:", deployer.address);

  const factoryFactory = await ethers.getContractFactory("BlastoffTokenFactory");
  const factory = await factoryFactory.deploy();
  await factory.waitForDeployment();

  // ethers v6: address is exposed as .target
  console.log("BlastoffTokenFactory deployed to:", factory.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


