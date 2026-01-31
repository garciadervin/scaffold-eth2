import { expect } from "chai";
import { ethers } from "hardhat";
import { UniversityPayments } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UniversityPayments", function () {
  let universityPayments: UniversityPayments;
  let owner: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  const SERVICE_NAME = "Matrícula Anual";
  const SERVICE_PRICE = ethers.parseEther("0.1");
  const UPDATED_NAME = "Matrícula Semestral";
  const UPDATED_PRICE = ethers.parseEther("0.05");

  beforeEach(async () => {
    [owner, student1, student2, nonOwner] = await ethers.getSigners();

    const UniversityPaymentsFactory = await ethers.getContractFactory("UniversityPayments");
    universityPayments = (await UniversityPaymentsFactory.deploy()) as UniversityPayments;
    await universityPayments.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await universityPayments.owner()).to.equal(owner.address);
    });

    it("Should start with zero services", async function () {
      expect(await universityPayments.getServiceCount()).to.equal(0);
    });

    it("Should start with zero payments", async function () {
      expect(await universityPayments.getPaymentCount()).to.equal(0);
    });

    it("Should start with zero balance", async function () {
      expect(await universityPayments.getContractBalance()).to.equal(0);
    });
  });

  describe("Service Creation", function () {
    it("Should allow owner to create a service", async function () {
      await expect(universityPayments.createService(SERVICE_NAME, SERVICE_PRICE))
        .to.emit(universityPayments, "ServiceCreated")
        .withArgs(0, SERVICE_NAME, SERVICE_PRICE);

      const services = await universityPayments.getServices();
      expect(services.length).to.equal(1);
      expect(services[0].name).to.equal(SERVICE_NAME);
      expect(services[0].price).to.equal(SERVICE_PRICE);
      expect(services[0].active).to.equal(true);
    });

    it("Should reject service creation with empty name", async function () {
      await expect(universityPayments.createService("", SERVICE_PRICE)).to.be.revertedWith(
        "Service name cannot be empty",
      );
    });

    it("Should reject service creation with zero price", async function () {
      await expect(universityPayments.createService(SERVICE_NAME, 0)).to.be.revertedWith(
        "Service price must be greater than 0",
      );
    });

    it("Should reject service creation from non-owner", async function () {
      await expect(
        universityPayments.connect(nonOwner).createService(SERVICE_NAME, SERVICE_PRICE),
      ).to.be.revertedWithCustomError(universityPayments, "OwnableUnauthorizedAccount");
    });

    it("Should increment service count correctly", async function () {
      await universityPayments.createService(SERVICE_NAME, SERVICE_PRICE);
      await universityPayments.createService("Curso de Verano", ethers.parseEther("0.05"));

      expect(await universityPayments.getServiceCount()).to.equal(2);
    });
  });

  describe("Service Updates", function () {
    beforeEach(async () => {
      await universityPayments.createService(SERVICE_NAME, SERVICE_PRICE);
    });

    it("Should allow owner to update a service", async function () {
      await expect(universityPayments.updateService(0, UPDATED_NAME, UPDATED_PRICE, false))
        .to.emit(universityPayments, "ServiceUpdated")
        .withArgs(0, UPDATED_NAME, UPDATED_PRICE, false);

      const services = await universityPayments.getServices();
      expect(services[0].name).to.equal(UPDATED_NAME);
      expect(services[0].price).to.equal(UPDATED_PRICE);
      expect(services[0].active).to.equal(false);
    });

    it("Should reject update with empty name", async function () {
      await expect(universityPayments.updateService(0, "", UPDATED_PRICE, true)).to.be.revertedWith(
        "Service name cannot be empty",
      );
    });

    it("Should reject update with zero price", async function () {
      await expect(universityPayments.updateService(0, UPDATED_NAME, 0, true)).to.be.revertedWith(
        "Service price must be greater than 0",
      );
    });

    it("Should reject update of non-existent service", async function () {
      await expect(universityPayments.updateService(999, UPDATED_NAME, UPDATED_PRICE, true)).to.be.revertedWith(
        "Service does not exist",
      );
    });

    it("Should reject update from non-owner", async function () {
      await expect(
        universityPayments.connect(nonOwner).updateService(0, UPDATED_NAME, UPDATED_PRICE, true),
      ).to.be.revertedWithCustomError(universityPayments, "OwnableUnauthorizedAccount");
    });
  });

  describe("Payment Processing", function () {
    beforeEach(async () => {
      await universityPayments.createService(SERVICE_NAME, SERVICE_PRICE);
    });

    it("Should process exact payment correctly", async function () {
      await expect(universityPayments.connect(student1).payForService(0, { value: SERVICE_PRICE }))
        .to.emit(universityPayments, "PaymentMade")
        .withArgs(student1.address, 0, SERVICE_PRICE);

      const payments = await universityPayments.getPayments();
      expect(payments.length).to.equal(1);
      expect(payments[0].student).to.equal(student1.address);
      expect(payments[0].serviceId).to.equal(0);
      expect(payments[0].amount).to.equal(SERVICE_PRICE);

      expect(await universityPayments.getContractBalance()).to.equal(SERVICE_PRICE);
    });

    it("Should process overpayment with refund", async function () {
      const overpayment = ethers.parseEther("0.05");
      const totalSent = SERVICE_PRICE + overpayment;

      const initialBalance = await ethers.provider.getBalance(student1.address);

      const tx = await universityPayments.connect(student1).payForService(0, { value: totalSent });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx)
        .to.emit(universityPayments, "PaymentMade")
        .withArgs(student1.address, 0, SERVICE_PRICE)
        .to.emit(universityPayments, "RefundIssued")
        .withArgs(student1.address, overpayment);

      // Contract should only keep the service price
      expect(await universityPayments.getContractBalance()).to.equal(SERVICE_PRICE);

      // Student should have received refund (minus gas)
      const finalBalance = await ethers.provider.getBalance(student1.address);
      expect(finalBalance).to.equal(initialBalance - SERVICE_PRICE - gasUsed);
    });

    it("Should reject payment for non-existent service", async function () {
      await expect(
        universityPayments.connect(student1).payForService(999, { value: SERVICE_PRICE }),
      ).to.be.revertedWith("Service does not exist");
    });

    it("Should reject payment for inactive service", async function () {
      await universityPayments.updateService(0, SERVICE_NAME, SERVICE_PRICE, false);

      await expect(universityPayments.connect(student1).payForService(0, { value: SERVICE_PRICE })).to.be.revertedWith(
        "Service is not active",
      );
    });

    it("Should reject insufficient payment", async function () {
      const insufficientAmount = ethers.parseEther("0.05");

      await expect(
        universityPayments.connect(student1).payForService(0, { value: insufficientAmount }),
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should track multiple payments correctly", async function () {
      await universityPayments.connect(student1).payForService(0, { value: SERVICE_PRICE });
      await universityPayments.connect(student2).payForService(0, { value: SERVICE_PRICE });

      expect(await universityPayments.getPaymentCount()).to.equal(2);
      expect(await universityPayments.getContractBalance()).to.equal(SERVICE_PRICE * 2n);
    });

    it("Should track student payments correctly", async function () {
      await universityPayments.createService("Curso de Verano", ethers.parseEther("0.05"));

      await universityPayments.connect(student1).payForService(0, { value: SERVICE_PRICE });
      await universityPayments.connect(student1).payForService(1, { value: ethers.parseEther("0.05") });

      const studentPayments = await universityPayments.getStudentPayments(student1.address);
      expect(studentPayments.length).to.equal(2);
      expect(studentPayments[0].serviceId).to.equal(0);
      expect(studentPayments[1].serviceId).to.equal(1);
    });
  });

  describe("Fund Withdrawal", function () {
    beforeEach(async () => {
      await universityPayments.createService(SERVICE_NAME, SERVICE_PRICE);
      await universityPayments.connect(student1).payForService(0, { value: SERVICE_PRICE });
    });

    it("Should allow owner to withdraw funds", async function () {
      const contractBalance = await universityPayments.getContractBalance();
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      const tx = await universityPayments.withdrawFunds();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx).to.emit(universityPayments, "FundsWithdrawn").withArgs(owner.address, contractBalance);

      expect(await universityPayments.getContractBalance()).to.equal(0);

      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + contractBalance - gasUsed);
    });

    it("Should reject withdrawal from non-owner", async function () {
      await expect(universityPayments.connect(nonOwner).withdrawFunds()).to.be.revertedWithCustomError(
        universityPayments,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should reject withdrawal when balance is zero", async function () {
      await universityPayments.withdrawFunds();

      await expect(universityPayments.withdrawFunds()).to.be.revertedWith("No funds to withdraw");
    });
  });

  describe("View Functions", function () {
    beforeEach(async () => {
      await universityPayments.createService(SERVICE_NAME, SERVICE_PRICE);
      await universityPayments.createService("Curso de Verano", ethers.parseEther("0.05"));
      await universityPayments.connect(student1).payForService(0, { value: SERVICE_PRICE });
    });

    it("Should return all services", async function () {
      const services = await universityPayments.getServices();
      expect(services.length).to.equal(2);
    });

    it("Should return all payments", async function () {
      const payments = await universityPayments.getPayments();
      expect(payments.length).to.equal(1);
    });

    it("Should return student-specific payments", async function () {
      await universityPayments.connect(student2).payForService(1, { value: ethers.parseEther("0.05") });

      const student1Payments = await universityPayments.getStudentPayments(student1.address);
      const student2Payments = await universityPayments.getStudentPayments(student2.address);

      expect(student1Payments.length).to.equal(1);
      expect(student2Payments.length).to.equal(1);
      expect(student1Payments[0].student).to.equal(student1.address);
      expect(student2Payments[0].student).to.equal(student2.address);
    });

    it("Should return correct contract balance", async function () {
      expect(await universityPayments.getContractBalance()).to.equal(SERVICE_PRICE);
    });

    it("Should return correct service count", async function () {
      expect(await universityPayments.getServiceCount()).to.equal(2);
    });

    it("Should return correct payment count", async function () {
      expect(await universityPayments.getPaymentCount()).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to transfer ownership", async function () {
      await universityPayments.transferOwnership(nonOwner.address);
      expect(await universityPayments.owner()).to.equal(nonOwner.address);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      await expect(
        universityPayments.connect(nonOwner).transferOwnership(student1.address),
      ).to.be.revertedWithCustomError(universityPayments, "OwnableUnauthorizedAccount");
    });

    it("Should allow new owner to perform owner actions", async function () {
      await universityPayments.transferOwnership(nonOwner.address);

      await expect(universityPayments.connect(nonOwner).createService("New Service", ethers.parseEther("0.1"))).to.not
        .be.reverted;
    });
  });
});
