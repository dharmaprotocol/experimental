contract SignatureTypes {
	struct ECDSASignature {
		uint8 v;
		bytes32 r;
		bytes32 s;
	}
}
