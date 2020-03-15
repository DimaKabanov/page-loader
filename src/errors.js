import errors from 'errno';
import _ from 'lodash';

export default (error) => {
  const errorList = [
    {
      check: () => _.has(errors.code, error.code),
      getMessage: () => errors.code[error.code].description,
    },
    {
      check: () => _.has(error, 'response'),
      getMessage: () => `${error.response.status} - ${error.response.statusText} - ${error.response.config.url}`,
    },
  ];
  const errorItem = errorList.find(({ check }) => check());
  const message = errorItem ? errorItem.getMessage() : error.message;

  return message;
};
