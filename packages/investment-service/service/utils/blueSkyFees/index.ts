// @ts-nocheck
import { updateBlueSkyFees, getDealTrackerDealRecords } from "../../airtable";
import { Investment, InvestorPassport } from "@allocations/core-models";

export const totalWiredByState = (transactions) => {
  return transactions.reduce((acc, curr) => {
    if (!acc[curr.passport.us_state]) {
      acc[curr.passport.us_state] = 0;
    }
    acc[curr.passport.us_state] = acc[curr.passport.us_state] +=
      curr.total_committed_amount;
    return acc;
  }, {});
};

export const totalWired = (transactions) => {
  return transactions.reduce(
    (acc, curr) => (acc += curr.total_committed_amount),
    0
  );
};

export const stateMap = [
  {
    name: "Alabama",
    abbreviation: "AL",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "Alaska",
    abbreviation: "AK",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 600,
    maxFee: 600,
  },
  {
    name: "Arizona",
    abbreviation: "AZ",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 0,
    maxFee: 0,
  },
  {
    name: "Arkansas",
    abbreviation: "AR",
    type: "variable",
    minFee: 100,
    max: 500,
    variableType: "state",
    calculator: ({ total, stateTotals, stateData }) => {
      const sTotalFee =
        ((stateTotals[stateData.name] || 0) * stateData.variableValue) / 100;
      if (!sTotalFee) return 0;
      return sTotalFee < stateData.minFee
        ? stateData.minfee
        : sTotalFee > stateData.maxFee
        ? stateData.maxFee
        : sTotalFee;
    },
    variableValue: 0.1,
  },
  {
    name: "California",
    abbreviation: "CA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "Colorado",
    abbreviation: "CO",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minfee: 50,
    maxFee: 50,
  },
  {
    name: "Connecticut",
    abbreviation: "CT",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 150,
    maxFee: 150,
  },
  {
    name: "Delaware",
    abbreviation: "DE",
    type: "variable",
    minFee: 200,
    maxFee: 1000,
    variableType: "state",
    variableValue: 0.5,
    calculator: ({ total, stateTotals, stateData }) => {
      const sTotalFee =
        ((stateTotals[stateData.name] || 0) * stateData.variableValue) / 100;
      if (!sTotalFee) return 0;

      const fee =
        sTotalFee < stateData.minFee
          ? stateData.minFee
          : sTotalFee > stateData.maxFee
          ? stateData.maxFee
          : sTotalFee;
      return fee;
    },
  },
  {
    name: "District Of Columbia",
    abbreviation: "DC",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Florida",
    abbreviation: "FL",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minfee: 0,
    maxFee: 0,
  },
  {
    name: "Georgia",
    abbreviation: "GA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Hawaii",
    abbreviation: "HI",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Idaho",
    abbreviation: "ID",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 50,
    maxFee: 50,
  },
  {
    name: "Illinois",
    abbreviation: "IL",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Indiana",
    abbreviation: "IN",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 0,
    maxFee: 0,
  },
  {
    name: "Iowa",
    abbreviation: "IA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Kansas",
    abbreviation: "KS",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 0,
    maxFee: 0,
  },
  {
    name: "Kentucky",
    abbreviation: "KY",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Louisiana",
    abbreviation: "LA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "Maine",
    abbreviation: "ME",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 0,
    maxFee: 0,
  },
  {
    name: "Maryland",
    abbreviation: "MD",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Massachusetts",
    abbreviation: "MA",
    type: "variable",
    minFee: 250,
    midFee: 500,
    maxFee: 750,
    variableType: "total",
    variableValue: "step",
    ceilings: [2000000, 7500000],
    calculator: ({ total, stateTotals, stateData }) => {
      if (!stateTotals[stateData.name]) return 0;

      if (total < stateData.ceilings[0]) {
        return stateData.minFee;
      } else if (total > stateData.ceilings[stateData.ceilings.length - 1]) {
        return stateData.maxFee;
      }
      return stateData.midFee;
    },
  },
  {
    name: "Michigan",
    abbreviation: "MI",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Minnesota",
    abbreviation: "MN",
    type: "fixed&Variable",
    minFee: 100,
    midFee: 200,
    maxFee: 300,
    variableType: "state",
    variableValue: 0.1,
    variableMax: 200,
    calculator: ({ total, stateTotals, stateData }) => {
      const fee =
        (stateTotals[stateData.name] || 0 * stateData.variableValue) / 100;
      if (fee === 0) return 0;
      return fee > stateData.maxFee
        ? stateData.maxFee
        : fee < stateData.minFee
        ? stateData.minFee
        : fee;
    },
  },
  {
    name: "Mississippi",
    abbreviation: "MS",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "Missouri",
    abbreviation: "MO",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Montana",
    abbreviation: "MT",
    type: "fixed&Variable",
    minFee: 200,
    midFee: 600,
    maxFee: 800,
    variableType: "state",
    variableValue: 0.1,
    ceilings: [100000],
    calculator: ({ total, stateTotals, stateData }) => {
      const sTotal = stateTotals[stateData.name];
      if (!sTotal) return 0;
      const overage =
        ((sTotal - stateData.ceilings[0]) * stateData.variableValue) / 100;
      return sTotal < stateData.ceilings[0] ? stateData.minFee : 200 + overage;
    },
  },
  {
    name: "Nebraska",
    abbreviation: "NE",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 200,
    maxFee: 200,
  },
  {
    name: "Nevada",
    abbreviation: "NV",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 500,
    maxFee: 500,
  },
  {
    name: "New Hampshire",
    abbreviation: "NH",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 500,
    maxFee: 500,
  },
  {
    name: "New Jersey",
    abbreviation: "NJ",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 500,
    maxFee: 500,
  },
  {
    name: "New Mexico",
    abbreviation: "NM",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 350,
    maxFee: 350,
  },
  {
    name: "New York",
    abbreviation: "NY",
    type: "variable",
    minFee: 300,
    maxFee: 1200,
    variableType: "total",
    variableValue: "step",
    ceilings: [500000],
    calculator: ({ total, stateTotals, stateData }) => {
      if (!stateTotals[stateData.name]) return 0;
      return total > stateData.ceilings[0]
        ? stateData.maxFee
        : stateData.minFee;
    },
  },
  {
    name: "North Carolina",
    abbreviation: "NC",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 350,
    maxFee: 350,
  },
  {
    name: "North Dakota",
    abbreviation: "ND",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Ohio",
    abbreviation: "OH",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 100,
    maxFee: 100,
  },
  {
    name: "Oklahoma",
    abbreviation: "OK",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Oregon",
    abbreviation: "OR",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Pennsylvania",
    abbreviation: "PA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 525,
    maxFee: 525,
  },
  {
    name: "Puerto Rico",
    abbreviation: "PR",
    type: "variable",
    minFee: 350,
    maxFee: 1500,
    variableType: "state",
    variableValue: 0.2,
    calculator: ({ total, stateTotals, stateData }) => {
      if (!stateTotals[stateData.name]) return 0;
      const fee =
        ((stateTotals[stateData.name] || 0) * stateData.variableValue) / 100;
      return fee > stateData.maxFee
        ? stateData.maxFee
        : fee < stateData.minFee
        ? stateData.minFee
        : fee;
    },
  },
  {
    name: "Rhode Island",
    abbreviation: "RI",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "South Carolina",
    abbreviation: "SC",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "South Dakota",
    abbreviation: "SD",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Tennessee",
    abbreviation: "TN",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 500,
    maxFee: 500,
  },
  {
    name: "Texas",
    abbreviation: "TX",
    type: "variable",
    minFee: 0,
    maxFee: 500,
    variableType: "total",
    variableValue: 0.1,
    calculator: ({ total, stateTotals, stateData }) => {
      if (!stateTotals[stateData.name]) return 0;
      const fee = (total * stateData.variableValue) / 100;
      if (fee === 0) return 0;
      return fee >= stateData.maxFee ? stateData.maxFee : fee;
    },
  },
  {
    name: "Utah",
    abbreviation: "UT",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      if (!stateTotals[stateData.name]) return 0;
      return total >= stateData.ceilings[0] ? 100 : 0;
    },
    minFee: 0,
    maxFee: 500,
    variableType: "total",
    variableType: "step",
    ceilings: [500000],
  },
  {
    name: "Vermont",
    abbreviation: "VT",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 600,
    maxFee: 600,
  },
  {
    name: "Virgin Islands",
    abbreviation: "VI",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 1500,
    maxFee: 1500,
  },
  {
    name: "Virginia",
    abbreviation: "VA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 250,
    maxFee: 250,
  },
  {
    name: "Washington",
    abbreviation: "WA",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 300,
    maxFee: 300,
  },
  {
    name: "West Virginia",
    abbreviation: "WV",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 150,
    maxFee: 150,
  },
  {
    name: "Wisconsin",
    abbreviation: "WI",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 200,
    maxFee: 200,
  },
  {
    name: "Wyoming",
    abbreviation: "WY",
    type: "fixed",
    calculator: ({ total, stateTotals, stateData }) => {
      return stateTotals[stateData.name] ? stateData.maxFee : 0;
    },
    minFee: 200,
    maxFee: 200,
  },
];

export const getNewBSFees = async (deal_id: string): Promise<any> => {
  const investments = await Investment.find({
    "metadata.deal_id": deal_id,
  }).populate<{
    passport: InvestorPassport;
  }>("passport_id").lean();
  const total = totalWired(investments);
  const stateTotals = totalWiredByState(investments);

  const feeTotalsByState = stateMap.map((stateData) => {
    return stateData.calculator
      ? {
          abbreviation: stateData.abbreviation,
          state: stateData.name,
          stateFeeAmount: stateData.calculator({
            total,
            stateTotals,
            stateData,
          }),
        }
      : {
          abbreviation: stateData.abbreviation,
          state: stateData.name,
          stateFeeAmount: 0,
        };
  });

  const blueSkyDealFees = investments
    .filter(
      (v, i, a) =>
        a.findIndex((t) => t.passport.us_state === v.passport.us_state) === i
    )
    .map((investment) => {
      const feeData =
        feeTotalsByState.find((s) => s.state === investment.passport.us_state) ||
        {};
      return { ...investment, feeData };
    });
  return blueSkyDealFees;
};

export const updateAirtableBSF = async (investments, deal_id) => {
  const records = await getDealTrackerDealRecords(deal_id);
  let updatedStates = {};
  const recordsWithFees = records.map((record) => {
    if (updatedStates[record["Investor State"]]) {
      return {
        ...record,
        feeData: { stateFeeAmount: 0 },
      };
    } else {
      const invWithFee = investments.find(
        (i) => i.passport.us_state === record["Investor State"]
      );
      updatedStates[record["Investor State"]] = true;
      return {
        ...record,
        feeData: invWithFee?.feeData || { stateFeeAmount: 0 },
      };
    }
  });
  const res = await Promise.all(
    recordsWithFees.map((inv) =>
      updateBlueSkyFees(inv, inv.feeData.stateFeeAmount)
    )
  );
  return res;
};
