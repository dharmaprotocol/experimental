pragma solidity 0.4.24;
//pragma experimental ABIEncoderV2;

import "../../shared/libraries/OrderLibrary.sol";
import "../../shared/libraries/SignaturesLibrary.sol";


contract NaiveDecisionEngine is OrderLibrary {

	function evaluateConsent(DebtOrder memory order)
		public
		view
		returns (bool signatureValid, bytes32 commitmentHash)
	{
		commitmentHash = hashCreditorCommitmentForOrder(order);

		signatureValid = SignaturesLibrary.isValidSignature(
			order.creditor,
			commitmentHash,
			order.creditorSignature
		);

		return (signatureValid, commitmentHash);
	}

	function hashCreditorCommitmentForOrder(DebtOrder memory order)
        public
        pure
        returns (bytes32 _creditorCommitmentHash)
    {
        return keccak256(
            order.creditor, // creditor
            order.kernelVersion, // debt kernel version
            order.issuanceVersion, // repayment router version
            order.termsContract, // terms contract address
            order.principalToken, // principal token address
            order.salt, // salt
            order.principalAmount, // principal amount
            order.creditorFee, // creditor fee
            order.expirationTimestampInSec, // expirationTimestampInSec
            order.termsContractParameters // terms contract parameters
        );
    }
}
