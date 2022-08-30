import { HttpError } from "@allocations/api-common";
import { Deal, DealAgreement } from "@allocations/core-models";
import { Request, RequestHandler } from "express";
import { signAgreement } from "../../../services/deals";

type SignDealAgreementPayload = {
  readonly accepted_intent_to_sign: boolean;
  readonly accepted_electronic_business: boolean;
  readonly signer_ip_address: string;
  readonly signer_user_id: string;
  readonly signer_email: string;
  readonly signature_date: Date;
};

export const signDealAgreement: RequestHandler = async (
  req: Request<{ [key: string]: string }, {}, SignDealAgreementPayload, {}, {}>,
  res,
  next
) => {
  try {
    const agreement = await DealAgreement.findByIdAndUpdate(
      req.params.id,
      {
        signed: true,
        signature_packet: req.body,
      },
      { new: true }
    );
    if (!agreement) {
      throw new HttpError("Agreement Not Found", 404);
    }

    res.send(agreement);

    await signAgreement(
      (await Deal.findById(agreement.deal_id))!,
      req.headers["x-api-token"] as string
    );
  } catch (e) {
    next(e);
  }
};
