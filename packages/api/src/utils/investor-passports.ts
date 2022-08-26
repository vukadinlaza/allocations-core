export const getFormType = ({
  type,
  country,
}: {
  type: string;
  country: string;
}) => {
  let prefix = "W-9";
  let suffix = "";

  if (country !== "United States") prefix = "W-8-BEN";
  if (type === "Entity") suffix = "-E";

  return prefix + suffix;
};
