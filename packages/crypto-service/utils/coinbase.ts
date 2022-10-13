import CryptoJS from "crypto-js";

type VerifyCoinbaseCommerceSignatureInput = {
  readonly payload: string;
  readonly sigHeader: string;
};

export const verifyCoinbaseCommerceSignature = ({
  payload,
  sigHeader,
}: VerifyCoinbaseCommerceSignatureInput): boolean => {
  // paylod is request.body sigHeader is webhook header
  const hmac = CryptoJS.HmacSHA256(
    payload,
    process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!
  );
  return hmac.toString(CryptoJS.enc.Hex) === sigHeader;
};
