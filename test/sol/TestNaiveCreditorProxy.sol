pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/src/CreditorDrivenLoans/NaiveCreditorProxy.sol";

import "../../contracts/src/shared/libraries/SignaturesLibrary.sol";


contract TestNaiveCreditorProxy {
	function testCancelDebtOffer() {
		// Get the deployed contract.
		NaiveCreditorProxy proxy = NaiveCreditorProxy(
			DeployedAddresses.NaiveCreditorProxy()
		);

		// Create ECDSA Signatures.
		SignaturesLibrary.ECDSASignature memory creditorSignature = SignaturesLibrary.ECDSASignature({
			v: uint8(0),
			r: bytes32(0),
			s: bytes32(0)
		});

		SignaturesLibrary.ECDSASignature memory debtorSignature = SignaturesLibrary.ECDSASignature({
			v: uint8(0),
			r: bytes32(0),
			s: bytes32(0)
		});

		SignaturesLibrary.ECDSASignature memory underwriterSignature = SignaturesLibrary.ECDSASignature({
			v: uint8(0),
			r: bytes32(0),
			s: bytes32(0)
		});

		// Generate a new test order.
		OrderLibrary.DebtOrder memory testOrder = OrderLibrary.DebtOrder({
			kernelVersion: address(0),
			issuanceVersion: address(0),
			principalAmount: uint(0),
			principalToken: address(0),
			collateralAmount: uint(0),
			collateralToken: address(0),
			debtor: address(0),
			debtorFee: uint(0),
			creditor: address(0),
			creditorFee: uint(0),
			relayer: address(0),
			relayerFee: uint(0),
			underwriter: address(0),
			underwriterFee: uint(0),
			underwriterRiskRating: uint(0),
			termsContract: address(0),
			termsContractParameters: bytes32(0),
			expirationTimestampInSec: uint(0),
			salt: uint(0),
			debtorSignature: debtorSignature,
			creditorSignature: creditorSignature,
			underwriterSignature: underwriterSignature
		});

		// Attempt to cancel the debt offer using this test order.
		bool cancelled = proxy.cancelDebtOffer(testOrder);
		Assert.isFalse(cancelled, "Should be false because the order doesn't exist");
	}
}
