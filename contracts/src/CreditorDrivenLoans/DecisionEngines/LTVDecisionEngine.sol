pragma solidity 0.4.25;

// External dependencies
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Libraries
import "./libraries/LTVDecisionEngineTypes.sol";


contract LTVDecisionEngine is
	OrderLibrary,
	LTVDecisionEngineTypes
{
	using SafeMath for uint;

	uint public constant PRECISION = 4;

	function evaluateConsent(Params params)
		public view returns (bool signatureValid, bytes32 _id)
	{
		DebtOrder order = params.order;
		CommitmentValues commitmentValues = params.creditorCommitment.values;

		bytes32 commitmentHash = hashOrder(commitmentValues, order);

		// Checks that the given creditor values were signed by the creditor.
		bool validCreditorSignature = verifyCreditorCommitmentHash(
			params.creditor,
			commitmentHash,
			params.creditorSignature
		);

		// We return early if the creditor values were not signed correctly.
		if (!validCreditorSignature) {
			return (false, commitmentHash);
		}

		// Checks that the given price feed data was signed by the price feed operator.
		return (
			verifyPrices(
				params.priceFeedOperator,
				params.principalPrice,
				params.collateralPrice
			),
			commitmentHash
		);
	}

	// Returns true if the creditor-initiated order has not expired, and the LTV is below the max.
	function evaluateDecision(Params params)
		public view returns (bool _success)
	{
		LTVDecisionEngineTypes.Price principalTokenPrice = params.principalPrice;
		LTVDecisionEngineTypes.Price collateralTokenPrice = params.collateralPrice;

		CommitmentValues commitmentValues = params.creditorCommitment.values;
		DebtOrder order = params.order;

		if (isExpired(commitmentValues.expirationTimestamp)) {
			return false;
		}

		uint ltv = computeLTV(
			principalTokenPrice.value,
			collateralTokenPrice.value,
			commitmentValues.principalAmount,
			order.collateralAmount
		);

		uint maxLTVWithPrecision = maxLTV.mul(10 ** (PRECISION.sub(2)));

		return computedLTV > maxLTVWithPrecision;
	}

	function hashOrder(CommitmentValues commitmentValues, DebtOrder order)
		returns (bytes32)
	{
		return keccak256(
			// LTV specific values.
			commitmentValues.maxLTV,
			commitmentValues.principalToken,
			commitmentValues.principalAmount,
			commitmentValues.expirationTimestamp,
			// Order specific values.
			order.creditor,
			order.repaymentRouter,
			order.creditorFee,
			order.underwriter,
			order.underwriterRiskRating,
			order.termsContract,
			order.termsContractParameters,
			order.commitmentExpirationTimestampInSec,
			order.salt
		);
	}

	function verifyCreditorCommitmentHash(
		address creditor,
		bytes32 commitmentHash,
		SignaturesLibrary.ECDSASignature signature
	)
		internal view returns(bool)
	{
		return SignaturesLibrary.isValidSignature(
			creditor,
			commitmentHash,
			signature
		);
	}

	function verifyPrices(
		address priceFeedOperator,
		LTVDecisionEngineTypes.Price principalPrice,
		LTVDecisionEngineTypes.Price collateralPrice
	)
		internal view returns (bool)
	{
		bytes32 principalPriceHash = keccack256(
			principalPrice.value,
			principalPrice.timestamp
		);

		bytes32 collateralPriceHash = keccack256(
			collateralPrice.value,
			collateralPrice.timestamp
		);

		bool principalPriceValid = SignaturesLibrary.isValidSignature(
			priceFeedOperator,
			principalPriceHash,
			principalPrice.signature
		);

		// We return early if the principal price information was not signed correctly.
		if (!principalPriceValid) {
			return false;
		}

		return SignaturesLibrary.isValidSignature(
			priceFeedOperator,
			collateralPriceHash,
			collateralPrice.signature
		);
	}

	function computeLTV(
		uint principalTokenPrice,
		uint collateralTokenPrice,
		uint principalAmount,
		uint collateralAmount
	)
		internal constant returns (uint)
	{
		uint principalValue = principalTokenPrice.mul(principalAmount).mul(10 ** PRECISION);
		uint collateralValue = collateralTokenPrice.mul(collateralAmount);

		return principalValue.div(collateralValue);
	}

	function isExpired(uint expirationTimestampInSec)
		internal view returns (bool expired)
	{
		return expirationTimestampInSec < block.timestamp;
	}
}
