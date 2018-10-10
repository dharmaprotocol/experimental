pragma solidity 0.4.25;
pragma experimental ABIEncoderV2;


contract SignaturesLibrary {
	bytes constant internal PREFIX = "\x19Ethereum Signed Message:\n32";

	struct ECDSASignature {
		uint8 v;
		bytes32 r;
		bytes32 s;
	}

	function isValidSignature(
		address signer,
		bytes32 hash,
		ECDSASignature signature
	)
		public
		pure
		returns (bool valid)
	{
		bytes32 prefixedHash = keccak256(PREFIX, hash);
		return ecrecover(prefixedHash, signature.v, signature.r, signature.s) == signer;
	}
}
