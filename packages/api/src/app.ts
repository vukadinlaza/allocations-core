import express from "express";
import { verify } from "jsonwebtoken";
import { checkToken, errorMiddleware } from "@allocations/api-common";
import expressPinoLogger from "express-pino-logger";
import dealRoutes from "./routes/v1/deals";
import documentRoutes from "./routes/v1/documents";
import organizationRoutes from "./routes/v1/organizations";
import organizationAdminRoutes from "./routes/v1/organizationsAdmin";
import entityRoutes from "./routes/v1/entities";
import taskRoutes from "./routes/v1/tasks";
import fileUpload from "express-fileupload";
import subscriptionAgreements from "./routes/v1/subscriptionAgreements";
import investments from "./routes/v1/investments";
import investmentDocuments from "./routes/v1/investment-documents";
import investorPassports from "./routes/v1/investor-passports";
import passportUsers from "./routes/v1/passport-users";
import plaidRoutes from "./routes/v1/plaid";
import organizationRoutesv2 from "./routes/v2/organizations";
import organizationModerators from "./routes/v2/organization-moderators";
import organizationAgreements from "./routes/v2/organization-agreements";
import organizationFundManagers from "./routes/v2/organization-fund-managers";
import investmentsV2 from "./routes/v2/investments";
import investmentAgreements from "./routes/v2/investment-agreements";

const app = express();

app.use(
  expressPinoLogger({
    serializers: {
      req: (req) => {
        let appName;
        try {
          const payload = verify(
            req.headers["x-api-token"],
            process.env.APP_SECRET!
          ) as { appName: string };
          appName = payload.appName;
        } catch {
          appName = "unknown";
        }

        return {
          method: req.method,
          url: req.url,
          appName: appName,
        };
      },
    },
  })
);

app.use(checkToken());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(fileUpload());

app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/organizations-admin", organizationAdminRoutes);
app.use("/api/v1/entities", entityRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/subscription-agreements", subscriptionAgreements);
app.use("/api/v1/investments", investments);
app.use("/api/v1/investment-documents", investmentDocuments);
app.use("/api/v1/investor-passports", investorPassports);
app.use("/api/v1/passport-users", passportUsers);
app.use("/api/v1/plaid", plaidRoutes);

app.use("/api/v2/organizations", organizationRoutesv2);
app.use("/api/v2/organization-fund-managers", organizationFundManagers);
app.use("/api/v2/organization-agreements", organizationAgreements);
app.use("/api/v2/organization-moderators", organizationModerators);
app.use("/api/v2/investments", investmentsV2);
app.use("/api/v2/investment-agreements", investmentAgreements);

app.use(errorMiddleware());

export default app;
