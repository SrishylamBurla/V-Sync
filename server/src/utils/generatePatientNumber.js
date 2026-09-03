import Counter from "../models/Counter.js";

export const generatePatientNumber = async (organizationId) => {
  const counter = await Counter.findOneAndUpdate(
    {
      organizationId,
      key: "patient",
    },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return `PT-${String(counter.sequence).padStart(6, "0")}`;
};
