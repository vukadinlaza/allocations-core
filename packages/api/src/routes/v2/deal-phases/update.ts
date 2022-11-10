import { HttpError } from "@allocations/api-common";
import { Deal, DealPhase } from "@allocations/core-models";
import { Request, RequestHandler } from "express";
type UpdatePhaseBody = {
  phase:
    | "new"
    | "build"
    | "post-build"
    | "pre-onboarding"
    | "onboarding"
    | "closing"
    | "post-closing"
    | "archived";
};

export const update: RequestHandler = async (
  req: Request<{ [key: string]: string }, {}, UpdatePhaseBody, {}, {}>,
  res,
  next
) => {
  const { phase: updatedPhase } = req.body;
  const phaseArray = [
    "new",
    "build",
    "post-build",
    "pre-onboarding",
    "onboarding",
    "closing",
    "post-closing",
    "closed",
    "archived",
  ];

  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal)
      throw new HttpError(`Deal with id ${req.params.id} not found`, 404);

    // complete every task that isn't an fm-upload or fm-signature between the current phase and the updated phase
    const startingIndex = phaseArray.indexOf(deal.phase);
    const endingIndex = phaseArray.indexOf(updatedPhase);

    if (startingIndex - endingIndex > 0)
      return res.send({ acknowledged: false });

    const phasesToComplete = phaseArray.slice(startingIndex, endingIndex);

    await Promise.all([
      DealPhase.updateMany(
        {
          deal_id: deal._id,
          name: { $in: phasesToComplete },
        },
        { "tasks.$[elem].complete": true },
        {
          arrayFilters: [
            {
              "elem.type": {
                $nin: [
                  "fm-document-upload",
                  "fm-document-signature",
                  "fm-document-signature-docspring",
                  "fm-review",
                ],
              },
            },
          ],
          new: true,
        }
      ),
      Deal.findByIdAndUpdate(deal._id, { phase: updatedPhase }),
      ...(updatedPhase === "onboarding"
        ? [
            DealPhase.findOneAndUpdate(
              { deal_id: deal._id, name: "onboarding" },
              { "tasks.$[elem].complete": true },
              {
                arrayFilters: [
                  {
                    "elem.title": {
                      $in: ["Ready to Onboard", "Deal Onboarding"],
                    },
                  },
                ],
                new: true,
              }
            ),
          ]
        : []),
    ]);

    res.send({ acknowledged: true });
  } catch (e) {
    next(e);
  }
};
