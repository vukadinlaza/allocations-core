import { PlaidAccount } from "@allocations/core-models";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";

export const handler = async () => {
  await connectMongoose();
  try {
    const accounts = await PlaidAccount.find({ phase: "synced" });

    await Promise.all(
      accounts.map(async (account) => {
        await triggerTransition({
          id: account._id.toString(),
          action: "RESYNC",
          phase: "synced",
        });
      })
    );
  } catch (e: any) {
    console.error(e);
  }
};
