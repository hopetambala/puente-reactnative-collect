const surveyingUserFailsafe = async (user, defautValue, validationFail) => {
  const userChecks = [
    defautValue,
    user?.username,
    user?.email,
    user?.id,
    user?.firstname,
    user?.lastname,
    "N/A",
  ];
  const validIdentifiers = userChecks.filter(
    (uniqueId) => validationFail(uniqueId) === false
  );
  return validIdentifiers[0];
};

export default surveyingUserFailsafe;
