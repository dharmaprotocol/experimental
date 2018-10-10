pragma solidity 0.4.25;

import "./SignaturesLibrary.sol";


contract OrderLibrary is
	SignaturesLibrary
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
		ECDSASignature debtorSignature;
		ECDSASignature creditorSignature;
		ECDSASignature underwriterSignature;
	}
}
