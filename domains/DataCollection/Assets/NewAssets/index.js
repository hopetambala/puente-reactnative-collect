import React from "react";
import { StyleSheet, View } from "react-native";

import AssetCore from "./AssetCore";
import AssetSupplementary from "./AssetSupplementary";

function NewAsset({
  selectedAsset,
  setSelectedAsset,
  surveyingOrganization,
  assetPageIndex,
  surveyingUser,
  scrollViewScroll,
  setScrollViewScroll,
  setPage,
}) {
  return <View>
    {assetPageIndex === "assetCore" && (
      <View style={styles.page}>
        <AssetCore
          setSelectedAsset={setSelectedAsset}
          selectedAsset={selectedAsset}
          surveyingOrganization={surveyingOrganization}
          surveyingUser={surveyingUser}
          scrollViewScroll={scrollViewScroll}
          setScrollViewScroll={setScrollViewScroll}
          setPage={setPage}
        />
      </View>
    )}
    {assetPageIndex === "assetSupplementary" && (
      <View style={styles.page}>
        <AssetSupplementary
          setSelectedAsset={setSelectedAsset}
          selectedAsset={selectedAsset}
          surveyingOrganization={surveyingOrganization}
          surveyingUser={surveyingUser}
          setPage={setPage}
        />
      </View>
    )}
  </View>
}

const styles = StyleSheet.create({
  page: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NewAsset;
