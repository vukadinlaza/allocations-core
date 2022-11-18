import CryptoJS from "crypto-js";
import crypto from "crypto";
import fs from "fs";

export const coinbaseCommerceHeaders = {
  "Content-Type": "application/json",
  "X-CC-Version": "2018-03-22",
};

type SignCoinbaseRequestInput = {
  readonly method: string;
  readonly path: string;
  readonly requestBody: any;
};

type SignCoinbaseRequestResult = {
  cb_access_sign: string;
  cb_access_timestamp: number;
};

// this will have to be updated to get into coinbase exchange.
// Will have to have CB-ACCESS-PASSPHRASE which we use when we generate api key for exchange
// this will be stored in secrets.
export const signCoinbaseRequest = ({
  method,
  path,
  requestBody,
}: SignCoinbaseRequestInput): SignCoinbaseRequestResult => {
  const cb_access_timestamp = Math.floor(Date.now() / 1000);
  const body = requestBody ?? "";
  const messageToSign = cb_access_timestamp + method + path + body;

  const hmac = CryptoJS.HmacSHA256(
    messageToSign,
    process.env.COINBASE_WALLET_API_SECRET! // this needs to be a string
  );
  const cb_access_sign = hmac.toString(CryptoJS.enc.Hex);

  return {
    cb_access_sign,
    cb_access_timestamp,
  };
};

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

type VerifyCoinbaseWalletSignatureInput = {
  readonly body: string;
  readonly signature: string;
};

export const verifyCoinbaseWalletSignature = ({
  body,
  signature,
}: VerifyCoinbaseWalletSignatureInput): boolean => {
  const coinbaseKey = fs.readFileSync("src/routes/util/cb-key.pub", "utf8");

  const verify = crypto.createVerify("sha256");
  verify.update(body);
  return verify.verify(coinbaseKey, signature, "base64");
};
