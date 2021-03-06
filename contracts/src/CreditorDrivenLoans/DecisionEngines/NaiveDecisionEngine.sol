pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../shared/libraries/OrderLibrary.sol";
import "../../shared/libraries/SignaturesLibrary.sol";


contract NaiveDecisionEngine is SignaturesLibrary, OrderLibrary {

	function evaluateConsent(DebtOrder memory order, bytes32 commitmentHash)
		public
		pure
		returns (bool)
	{
		return isValidSignature(
			order.creditor,
			commitmentHash,
			order.creditorSignature
		);
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
