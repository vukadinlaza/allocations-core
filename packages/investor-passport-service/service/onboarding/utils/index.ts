import {
  InvestorPassport,
  PassportAsset,
  TaxInformation,
} from "@allocations/core-models";

export const hasIdentification = async (passport: InvestorPassport) => {
  const [taxInfo, governmentIssuedId] = await Promise.all([
    TaxInformation.findOne({ passport_id: passport._id }),
    PassportAsset.findOne({
      passport_id: passport._id,
      type: "government-issued-id",
    }),
  ]);

  return taxInfo && governmentIssuedId;
};
