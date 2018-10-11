pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./SignaturesLibrary.sol";

contract OrderLibrary {
	struct DebtOrder {
		address kernelVersion;
		address issuanceVersion;
		uint principalAmount;
		address principalToken;
		uint collateralAmount;
		address collateralToken;
		address debtor;
		uint debtorFee;
		address creditor;
		uint creditorFee;
		address relayer;
		uint relayerFee;
		address underwriter;
		uint underwriterFee;
		uint underwriterRiskRating;
		address termsContract;
		bytes32 termsContractParameters;
		uint expirationTimestampInSec;
		uint salt;
		SignaturesLibrary.ECDSASignature debtorSignature;
		SignaturesLibrary.ECDSASignature creditorSignature;
		SignaturesLibrary.ECDSASignature underwriterSignature;
	}

	function unpackDebtOrder(DebtOrder memory order)
		public
		pure
		returns (
	        address[6] orderAddresses,
	        uint[8] orderValues,
	        bytes32[1] orderBytes32,
	        uint8[3] signaturesV,
	        bytes32[3] signaturesR,
	        bytes32[3] signaturesS
		)
	{
		return (
			[order.kernelVersion, order.debtor, order.underwriter, order.termsContract, order.principalToken, order.relayer],
            [order.underwriterRiskRating, order.salt, order.principalAmount, order.underwriterFee, order.relayerFee, order.creditorFee, order.debtorFee, order.expirationTimestampInSec],
			[order.termsContractParameters],
            [order.debtorSignature.v, order.creditorSignature.v, order.underwriterSignature.v],
			[order.debtorSignature.r, order.creditorSignature.r, order.underwriterSignature.r],
			[order.debtorSignature.s, order.creditorSignature.s, order.underwriterSignature.s]
		);
	}
}
