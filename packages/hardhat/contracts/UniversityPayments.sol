// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title UniversityPayments
/// @notice A transparent and decentralized payment system for university services
/// @dev Implements payment processing with automatic refunds for overpayments
contract UniversityPayments is Ownable {
    struct Service {
        string name;
        uint256 price;
        bool active;
    }

    struct Payment {
        address student;
        uint256 serviceId;
        uint256 amount;
        uint256 timestamp;
    }

    Service[] public services;
    Payment[] public payments;
    mapping(address => Payment[]) public studentPayments;

    event ServiceCreated(uint256 indexed serviceId, string name, uint256 price);
    event ServiceUpdated(uint256 indexed serviceId, string name, uint256 price, bool active);
    event PaymentMade(address indexed student, uint256 indexed serviceId, uint256 amount);
    event RefundIssued(address indexed student, uint256 amount);
    event FundsWithdrawn(address indexed admin, uint256 amount);

    /// @notice Initializes the contract with the deployer as owner
    constructor() Ownable(msg.sender) {}

    /// @notice Creates a new service
    /// @dev Only callable by contract owner
    /// @param _name The name of the service
    /// @param _price The price in wei for the service
    function createService(string memory _name, uint256 _price) external onlyOwner {
        require(bytes(_name).length > 0, "Service name cannot be empty");
        require(_price > 0, "Service price must be greater than 0");

        services.push(Service(_name, _price, true));
        emit ServiceCreated(services.length - 1, _name, _price);
    }

    /// @notice Updates an existing service
    /// @dev Only callable by contract owner
    /// @param _serviceId The ID of the service to update
    /// @param _name The new name for the service
    /// @param _price The new price in wei for the service
    /// @param _active Whether the service should be active
    function updateService(uint256 _serviceId, string memory _name, uint256 _price, bool _active) external onlyOwner {
        require(_serviceId < services.length, "Service does not exist");
        require(bytes(_name).length > 0, "Service name cannot be empty");
        require(_price > 0, "Service price must be greater than 0");

        services[_serviceId].name = _name;
        services[_serviceId].price = _price;
        services[_serviceId].active = _active;

        emit ServiceUpdated(_serviceId, _name, _price, _active);
    }

    /// @notice Processes a payment for a service
    /// @dev Automatically refunds any overpayment to the student
    /// @param _serviceId The ID of the service being paid for
    function payForService(uint256 _serviceId) external payable {
        require(_serviceId < services.length, "Service does not exist");
        require(services[_serviceId].active, "Service is not active");
        require(msg.value >= services[_serviceId].price, "Insufficient payment");

        uint256 servicePrice = services[_serviceId].price;
        uint256 overpayment = msg.value - servicePrice;

        // Record payment with actual service price
        payments.push(Payment(msg.sender, _serviceId, servicePrice, block.timestamp));
        studentPayments[msg.sender].push(payments[payments.length - 1]);

        emit PaymentMade(msg.sender, _serviceId, servicePrice);

        // Refund overpayment if any
        if (overpayment > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{ value: overpayment }("");
            require(refundSuccess, "Refund failed");
            emit RefundIssued(msg.sender, overpayment);
        }
    }

    /// @notice Withdraws all contract funds to the owner
    /// @dev Only callable by contract owner
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{ value: balance }("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(owner(), balance);
    }

    /// @notice Returns all available services
    /// @return Array of all services
    function getServices() external view returns (Service[] memory) {
        return services;
    }

    /// @notice Returns all payments made
    /// @return Array of all payments
    function getPayments() external view returns (Payment[] memory) {
        return payments;
    }

    /// @notice Returns all payments made by a specific student
    /// @param _student The address of the student
    /// @return Array of payments made by the student
    function getStudentPayments(address _student) external view returns (Payment[] memory) {
        return studentPayments[_student];
    }

    /// @notice Returns the current contract balance
    /// @return The balance in wei
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Returns the total number of services
    /// @return The count of services
    function getServiceCount() external view returns (uint256) {
        return services.length;
    }

    /// @notice Returns the total number of payments
    /// @return The count of payments
    function getPaymentCount() external view returns (uint256) {
        return payments.length;
    }
}
