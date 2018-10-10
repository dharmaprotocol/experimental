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
		DebtOrder memory order = params.order;
		CommitmentValues memory commitmentValues = params.creditorCommitment.values;

		bytes32 commitmentHash = hashOrder(commitmentValues, order);

		// Checks that the given creditor values were signed by the creditor.
		bool validCreditorSignature = isValidSignature(
			params.creditor,
			commitmentHash,
			commitmentValues.signature
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
	function evaluateDecision(Params memory params)
		public view returns (bool _success)
	{
		LTVDecisionEngineTypes.Price memory principalTokenPrice = params.principalPrice;
		LTVDecisionEngineTypes.Price memory collateralTokenPrice = params.collateralPrice;

		CommitmentValues memory commitmentValues = params.creditorCommitment.values;
		DebtOrder memory order = params.order;

		if (isExpired(commitmentValues.expirationTimestamp)) {
			return false;
		}

		uint ltv = computeLTV(
			principalTokenPrice.value,
			collateralTokenPrice.value,
			commitmentValues.principalAmount,
			order.collateralAmount
		);

		uint maxLTVWithPrecision = commitmentValues.maxLTV.mul(10 ** (PRECISION.sub(2)));

		return ltv > maxLTVWithPrecision;
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

	function verifyPrices(
		address priceFeedOperator,
		LTVDecisionEngineTypes.Price principalPrice,
		LTVDecisionEngineTypes.Price collateralPrice
	)
		internal view returns (bool)
	{
		bytes32 principalPriceHash = keccak256(
			principalPrice.value,
			principalPrice.timestamp
		);

		bytes32 collateralPriceHash = keccak256(
			collateralPrice.value,
			collateralPrice.timestamp
		);

		bool principalPriceValid = isValidSignature(
			priceFeedOperator,
			principalPriceHash,
			principalPrice.signature
		);

		// We return early if the principal price information was not signed correctly.
		if (!principalPriceValid) {
			return false;
		}

		return isValidSignature(
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
