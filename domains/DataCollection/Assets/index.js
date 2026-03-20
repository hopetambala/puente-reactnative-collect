import React, { useState } from "react";
import { View } from "react-native";

import NewAssets from "./NewAssets";
import ViewAssets from "./ViewAssets";

function Assets({
  selectedAsset,
  setSelectedAsset,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) {
  const [page, setPage] = useState("assetCore");

  const switchAssetPage = (pageIndex, asset) => {
    setPage(pageIndex);
    setSelectedAsset(asset);
  };
  return (
    <View>
      {selectedAsset && (
        <NewAssets
          setSelectedAsset={setSelectedAsset}
          selectedAsset={selectedAsset}
          surveyingOrganization={surveyingOrganization}
          assetPageIndex={page}
          scrollViewScroll={scrollViewScroll}
          setScrollViewScroll={setScrollViewScroll}
          setPage={setPage}
        />
      )}
      {selectedAsset === null && (
        <ViewAssets
          organization={surveyingOrganization}
          switchAssetPage={switchAssetPage}
        />
      )}
    </View>
  );
}

export default Assets;
