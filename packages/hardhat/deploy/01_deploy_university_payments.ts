import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployUniversityPayments: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("UniversityPayments", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const universityPayments = await hre.ethers.getContract<Contract>("UniversityPayments", deployer);

  await universityPayments.createService("Matrícula Anual", hre.ethers.parseEther("0.1"), { gasLimit: 500000 });
  await universityPayments.createService("Curso de Verano", hre.ethers.parseEther("0.05"), { gasLimit: 500000 });
  await universityPayments.createService("Certificado Oficial", hre.ethers.parseEther("0.02"), { gasLimit: 500000 });

  console.log("✅ Servicios iniciales creados con éxito");
};

export default deployUniversityPayments;

deployUniversityPayments.tags = ["UniversityPayments"];
