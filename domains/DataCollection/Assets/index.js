import React, { useState } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
    </TouchableWithoutFeedback>
  );
}

export default Assets;
