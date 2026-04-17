import selectedENV from "@app/environment";

function getTasks() {
  // eslint-disable-next-line global-require
  const axios = require("axios");
  const { taskyUrlApi } = selectedENV;

  return axios.get(`${taskyUrlApi}/tasks`).then(async (response) => {
    const data = await response.data.tasks;
    return data;
  });
  // .catch((error) => {
  //   console.log(error);
  // });
}

export default getTasks;
