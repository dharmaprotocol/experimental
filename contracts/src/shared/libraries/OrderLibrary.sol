pragma solidity ^0.4.24;

import "./SignaturesLibrary.sol";


contract OrderLibrary
{
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
}
