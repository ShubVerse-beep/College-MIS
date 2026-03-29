const ApiError = require("../utils/ApiError");

const validate = (schema, property = "body") => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return next(
      new ApiError(
        400,
        "Validation failed",
        error.details.map((detail) => detail.message)
      )
    );
  }

  req[property] = value;
  return next();
};

module.exports = validate;

