pragma solidity 0.4.25;

import "./SignaturesLibrary.sol";


contract OrderLibrary {
	struct DebtOrderData {
		address kernelVersion;
		address issuanceVersion;
		uint principalAmount;
		address principalToken;
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
