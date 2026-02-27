import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Blastoff contracts with account:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("Deployer balance (wei):", balance.toString());

  const factoryFactory = await ethers.getContractFactory("BlastoffTokenFactory");
  const factory = await factoryFactory.deploy();
  await factory.deployed();

  console.log("BlastoffTokenFactory deployed to:", factory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

