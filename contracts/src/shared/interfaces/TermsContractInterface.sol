pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;


contract TermsContractInterface {

	function registerTermStart(
        bytes32 agreementId,
        address debtor
    ) public returns (bool _success);

	function registerRepayment(
        bytes32 agreementId,
        address payer,
        address beneficiary,
        uint256 unitsOfRepayment,
        address tokenAddress
    ) public returns (bool _success);

	function getExpectedRepaymentValue(
        bytes32 agreementId,
        uint256 timestamp
    ) public view returns (uint256);

	function getValueRepaidToDate(
        bytes32 agreementId
    ) public view returns (uint256);

	function getTermEndTimestamp(
        bytes32 _agreementId
    ) public view returns (uint);

}
