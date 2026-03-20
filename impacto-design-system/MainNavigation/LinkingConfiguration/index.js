import * as Linking from "expo-linking";

export default {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Root: {
        path: "root",
        screens: {
          Data_Collection: "data_collection",
          Find_Records: "find_records",
          Assets: "assets",
          Sign_Up: "sign_up",
          Sign_In: "sign_in",
          GetPincode: "get_pincode",
        },
      },
      Settings: "settings",
    },
  },
};
