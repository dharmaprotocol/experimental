pragma solidity 0.4.25;


contract SignaturesLibrary {
	struct ECDSASignature {
		uint8 v;
		bytes32 r;
		bytes32 s;
	}

	function isValidSignature(
		address signer,
		bytes32 prefix,
		bytes32 hash,
		ECDSASignature signature
	)
		public
		pure
		returns (bool valid)
	{
		bytes32 prefixedHash = keccak256(prefix, hash);
		return ecrecover(prefixedHash, signature.v, signature.r, signature.s) == signer;
	}
}
